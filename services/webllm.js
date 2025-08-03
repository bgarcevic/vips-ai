import {
    CreateMLCEngine,
    prebuiltAppConfig,
} from "@mlc-ai/web-llm";

export class WebLLMService {
    constructor() {
        this.engine = null;
        this.selectedModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
        this.availableModels = prebuiltAppConfig?.model_list?.map(m => m.model_id) || [];
        this.systemPrompt = `You are a precise AI grocery shopping assistant for the Danish market. Your task is to analyze a user's request and select the single best product from a provided JSON list of available products.

**Rules for Selection:**
1. Prioritize an exact or close match in the \`Name\` field.
2. Use \`Labels\` and \`Description\` for specifics. For "organic", match "Øko". For "small", match "små". For quantity, check the \`Description\` (e.g., "1 stk.", "550 g.").
3. **Default Choice:** If the user's request is generic (e.g., "banan"), choose the most standard, non-organic option, which is usually the cheapest per unit (\`UnitPriceCalc\`).
4. **Ties:** If multiple products are an equally good match, select the one with the lower \`Price\`.

**CRITICAL OUTPUT REQUIREMENT:**
You MUST respond with ONLY the product ID as a plain string. Do NOT include any explanations, formatting, or additional text. Just the ID number.`;
    }

    getAvailableModels() {
        return this.availableModels;
    }

    getCurrentModel() {
        return this.selectedModel;
    }

    async initializeEngine(modelId, progressCallback) {
        try {
            this.selectedModel = modelId;

            if (!this.engine) {
                this.engine = await CreateMLCEngine(this.selectedModel, {
                    initProgressCallback: progressCallback,
                    temperature: 0.0
                });
            } else {
                const config = { temperature: 0.0 };
                await this.engine.reload(this.selectedModel, config);
            }

            return { success: true };
        } catch (error) {
            console.error("Failed to initialize WebLLM engine:", error);
            return { success: false, error: error.message };
        }
    }

    isEngineReady() {
        return this.engine !== null;
    }

    formatUserPrompt(groceryItem, filteredProductData) {
        return `Please select the best product ID for: "${groceryItem}"

Available Products:
${JSON.stringify(filteredProductData, null, 2)}`;
    }

    async selectProduct(groceryItem, filteredProductData) {
        if (!this.engine) {
            throw new Error('AI agent ikke klar - download først din model');
        }

        const userPrompt = this.formatUserPrompt(groceryItem, filteredProductData);

        const response = await this.engine.chat.completions.create({
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: userPrompt }
            ]
        });

        let selectedProductId = response.choices[0].message.content.trim();
        
        const match = selectedProductId.match(/\d+/);
        selectedProductId = match ? match[0] : selectedProductId;

        console.log('Cleaned product ID:', selectedProductId);

        const selectedProduct = filteredProductData.Products.Products.find(p => p.Id === selectedProductId);
        
        return {
            productId: selectedProductId,
            product: selectedProduct
        };
    }
}