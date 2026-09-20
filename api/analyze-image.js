module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body || {};

    if (!image) {
      return res.status(400).json({
        error: "No product image was provided."
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `
You are SellSpark, an AI product research and ecommerce assistant.

Analyze the product shown in the image carefully.

Return a useful ecommerce analysis using EXACTLY these sections:

PRODUCT NAME:
Give the most accurate product name you can determine from the image.

PRODUCT DESCRIPTION:
Write a clear, customer-friendly description explaining what the product is and what it does. Do not invent specifications that cannot be determined from the image.

PRODUCT CATEGORY:
Give the most appropriate ecommerce category.

TARGET CUSTOMER:
Describe the most likely customers who would be interested in this product.

KEY SELLING POINTS:
Give 4 to 6 specific selling points based on visible or reasonably supported product features.

POTENTIAL PROBLEMS/COMPETITION:
Mention realistic issues a seller should consider, such as competition, quality uncertainty, compatibility, shipping concerns, returns, or other relevant risks. Do not invent specific competitors unless they are clearly known.

SUGGESTED SELLING PRICE:
Give a reasonable retail price range based on the apparent product type and positioning. Clearly state that this is an estimate and that actual supplier cost, shipping, fees, and market prices should be checked.

ESTIMATED PROFIT:
Explain that profit depends on actual product cost, shipping, payment fees, platform fees, advertising costs, and the final selling price. Do not pretend to know the user's supplier cost unless it is provided.

PRODUCT LISTING:
Create a ready-to-use ecommerce listing with:
- Product title
- Short description
- Detailed description
- 5 bullet-point benefits
- Suggested keywords

TIKTOK/INSTAGRAM AD IDEAS:
Give 3 short-form video ad concepts. For each one include:
- Hook
- What to show
- Short call-to-action

IMPORTANT:
- Base the analysis on the actual image.
- Do not claim that a product is "trending", "best-selling", "viral", or "premium" unless the image provides evidence.
- Do not invent certifications, materials, dimensions, compatibility, battery information, or other specifications.
- Make the response practical for a dropshipping/ecommerce seller.
- Use plain text headings exactly as written above.
`
              },
              {
                type: "input_image",
                image_url: image
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed."
      });
    }

    const outputText =
      data.output
        ?.flatMap(item => item.content || [])
        ?.find(item => item.type === "output_text")
        ?.text || "";

    if (!outputText) {
      return res.status(500).json({
        error: "The AI returned no analysis."
      });
    }

    return res.status(200).json({
      result: outputText
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error."
    });
  }
};
