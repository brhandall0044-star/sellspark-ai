module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { question, product } = req.body || {};

    if (!question) {
      return res.status(400).json({
        error: "No question was provided."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: `
You are SellSpark AI, an ecommerce business assistant.

Help online sellers with:
- Product ideas
- Product pricing
- TikTok ideas
- Social media content
- Product listings
- Advertising ideas
- Dropshipping questions
- Profit and business strategy

Give practical, clear answers.
Do not invent facts about a product.
If product information is missing, say what information is needed.

Keep answers easy to understand for a small online business owner.
`
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text:
                    `Product information:
${product || "No product information provided."}

User question:
${question}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data.error?.message ||
          "The AI request failed."
      });
    }

    const answer =
      data.output
        ?.flatMap(item => item.content || [])
        ?.find(item => item.type === "output_text")
        ?.text || "";

    if (!answer) {
      return res.status(500).json({
        error: "The AI returned no answer."
      });
    }

    return res.status(200).json({
      answer
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error."
    });
  }
};
