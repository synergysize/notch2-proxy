const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies with larger limit for complex prompts
app.use(express.json({ limit: '10mb' }));

// The Claude API endpoint
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = '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';

// Proxy endpoint for Claude API
app.post('/chat', async (req, res) => {
  try {
    console.log('Received request to /chat endpoint');
    
    // Extract parameters from the request
    const { messages, system, temperature = 0.7, model = 'claude-3-opus-20240229' } = req.body;
    
    // Validate required parameters
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'Invalid or missing messages array in request'
      });
    }
    
    if (!system || typeof system !== 'string') {
      return res.status(400).json({
        error: true,
        message: 'Missing or invalid system prompt in request'
      });
    }
    
    // Prepare the request for Claude API
    const claudeRequest = {
      model: 'claude-3-opus-20240229', // Always use this model as specified
      max_tokens: 1000,
      temperature: 0.7, // Always use 0.7 as specified
      messages,
      system
    };
    
    console.log('Sending to Claude API with model:', claudeRequest.model);
    
    // Make request to Claude API
    const response = await axios.post(CLAUDE_API_URL, claudeRequest, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });
    
    console.log('Received response from Claude API successfully');
    
    // Send the response back to the client
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying request to Claude API:', error.message);
    
    // If axios error has response, send the error details
    if (error.response) {
      console.error('Claude API response error:', error.response.status, error.response.data);
      res.status(error.response.status).json({
        error: true,
        message: 'Error from Claude API',
        details: error.response.data
      });
    } else {
      // Otherwise send a generic error
      res.status(500).json({
        error: true,
        message: 'Internal server error',
        details: error.message
      });
    }
  }
});

// Debug endpoint to check what parameters are being received
app.post('/debug', (req, res) => {
  console.log('Debug request received:', req.body);
  res.json({
    received: req.body,
    message: 'Debug request received successfully'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Claude API proxy server is running'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Claude API proxy server running at http://localhost:${port}`);
  console.log(`Using Claude API endpoint: ${CLAUDE_API_URL}`);
});