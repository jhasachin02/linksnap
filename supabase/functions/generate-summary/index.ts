import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const JINA_API_URL = 'https://r.jina.ai/';
const MAX_CONTENT_LENGTH = 10000; // Limit content length for processing
const SUMMARY_MAX_LENGTH = 500; // Max summary length

interface RequestPayload {
  bookmarkId: string;
}

interface JinaResponse {
  data?: {
    content?: string;
    title?: string;
  };
  content?: string;
  title?: string;
}

/**
 * Validates URL to ensure it's safe to process
 */
function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const allowedProtocols = ['http:', 'https:'];
    
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }

    // Block localhost/private IPs in production
    const hostname = urlObj.hostname.toLowerCase();
    const privatePatterns = [
      'localhost',
      '127.0.0.1',
      '::1',
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./
    ];

    return !privatePatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return hostname === pattern;
      }
      return pattern.test(hostname);
    });
  } catch {
    return false;
  }
}

/**
 * Generates a summary from content using simple extractive summarization
 */
function generateSummary(content: string): string {
  if (!content || content.length === 0) {
    throw new Error('No content to summarize');
  }

  // Clean and normalize the content
  let cleanContent = content
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[^\w\s.,!?;:()-]/g, '') // Remove special characters
    .trim();

  if (cleanContent.length === 0) {
    throw new Error('No meaningful content found after cleaning');
  }

  // Truncate if too long
  if (cleanContent.length > MAX_CONTENT_LENGTH) {
    cleanContent = cleanContent.substring(0, MAX_CONTENT_LENGTH);
  }

  // Split into sentences
  const sentences = cleanContent
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Filter out very short sentences

  if (sentences.length === 0) {
    // Fallback: use first part of content
    return cleanContent.substring(0, Math.min(200, cleanContent.length)) + '...';
  }

  // Take first 2-3 sentences based on length
  let summary = '';
  let sentenceCount = 0;
  const maxSentences = 3;

  for (const sentence of sentences) {
    const potentialSummary = summary + (summary ? '. ' : '') + sentence;
    
    if (potentialSummary.length > SUMMARY_MAX_LENGTH && summary.length > 0) {
      break;
    }
    
    summary = potentialSummary;
    sentenceCount++;
    
    if (sentenceCount >= maxSentences) {
      break;
    }
  }

  return summary + (summary.endsWith('.') ? '' : '.');
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!supabaseClient) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Parse and validate request
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      throw new Error('Invalid JSON payload');
    }

    const { bookmarkId }: RequestPayload = requestBody;

    if (!bookmarkId || typeof bookmarkId !== 'string') {
      throw new Error('Valid bookmark ID is required');
    }

    // Get the bookmark with user verification
    const { data: bookmark, error: fetchError } = await supabaseClient
      .from('bookmarks')
      .select('*')
      .eq('id', bookmarkId)
      .single();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      throw new Error('Bookmark not found');
    }

    if (!bookmark || !bookmark.url) {
      throw new Error('Invalid bookmark data');
    }

    // Validate URL before processing
    if (!validateUrl(bookmark.url)) {
      throw new Error('URL is not safe to process');
    }

    console.log(`Processing summary for: ${bookmark.url}`);

    // Generate summary using Jina AI with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let jinaResponse: Response;
    try {
      jinaResponse = await fetch(`${JINA_API_URL}${bookmark.url}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BookmarkAI/1.0',
          'Authorization': 'Bearer jina_df5e8a5450d34636be869b6258dc9d2c6MZ4sNVZuwO7_LGCYvIGPrfUJA_9',
          'X-With-Generated-Alt': 'true'
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!jinaResponse.ok) {
      console.error(`Jina API error: ${jinaResponse.status} ${jinaResponse.statusText}`);
      throw new Error(`Failed to fetch content: HTTP ${jinaResponse.status}`);
    }

    let jinaData: JinaResponse;
    try {
      jinaData = await jinaResponse.json();
    } catch {
      throw new Error('Invalid response from content service');
    }
    
    // Extract content from different possible response formats
    const content = jinaData.data?.content || jinaData.content || '';
    
    if (!content || content.trim().length === 0) {
      throw new Error('No content found to summarize');
    }

    // Generate summary
    const summary = generateSummary(content);

    // Update the bookmark with the summary
    const { error: updateError } = await supabaseClient
      .from('bookmarks')
      .update({ 
        summary: summary,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookmarkId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to save summary');
    }

    console.log(`Successfully generated summary for bookmark ${bookmarkId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: summary,
        bookmarkId: bookmarkId
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Summary generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = errorMessage.includes('not found') ? 404 : 
                      errorMessage.includes('not allowed') ? 405 :
                      errorMessage.includes('Invalid') ? 400 : 500;

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});