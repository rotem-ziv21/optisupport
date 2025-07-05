import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Analyzes the urgency of a ticket based on its description
 * @param {string} text - The ticket description text
 * @returns {Object} - Object containing urgency level and recommendation
 */
export const analyzeUrgency = async (text) => {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OpenAI API key');
      return { 
        urgency: 'medium', 
        recommendation: 'Unable to analyze urgency. Please review manually.' 
      };
    }

    // Prepare the prompt for the AI
    const prompt = `
      Analyze the following customer support ticket and determine its urgency level.
      Return ONLY a JSON object with two fields:
      1. "urgency": either "low", "medium", or "high"
      2. "recommendation": a brief action recommendation based on the content

      Customer ticket: "${text}"
    `;

    // Make API call to OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an AI assistant that analyzes customer support tickets to determine their urgency and provide recommendations.' 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract and parse the AI response
    const aiResponse = response.data.choices[0].message.content.trim();
    let result;

    try {
      // Try to parse the JSON response
      result = JSON.parse(aiResponse);
      
      // Validate the response format
      if (!result.urgency || !result.recommendation) {
        throw new Error('Invalid response format');
      }
      
      // Ensure urgency is one of the expected values
      if (!['low', 'medium', 'high'].includes(result.urgency)) {
        result.urgency = 'medium';
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback response
      result = {
        urgency: 'medium',
        recommendation: 'Unable to analyze urgency. Please review manually.'
      };
    }

    return result;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Return default values if API call fails
    return {
      urgency: 'medium',
      recommendation: 'Unable to analyze urgency. Please review manually.'
    };
  }
};
