// Test script to call Google Gemini AI API
// This demonstrates how to interact with Gemini 2.0 Flash model

const testGeminiAPI = async () => {
  const apiKey = 'AIzaSyDNNN6PECwTBPzSQqM7nOkblJms8NWgo0Q';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: "Explain how AI works in a few words"
          }
        ]
      }
    ]
  };

  try {
    console.log('🤖 Calling Gemini AI API...');
    console.log('📝 Request:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Gemini AI Response:');
      console.log(JSON.stringify(data, null, 2));
      
      // Extract and display the AI's response text
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        console.log('\n🎯 AI Answer:', aiResponse);
      }
    } else {
      const errorData = await response.text();
      console.error('❌ API Error:', response.status, errorData);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Run the test
testGeminiAPI();