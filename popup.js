import {
    CreateMLCEngine,
    prebuiltAppConfig,
} from "@mlc-ai/web-llm";

/*************** WebLLM logic ***************/
const messages = [
    {
        content: "You are a helpful AI agent helping users.",
        role: "system",
    },
];

const availableModels = prebuiltAppConfig?.model_list?.map(
    (m) => m.model_id,
)
let selectedModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC";

// System prompt for AI grocery shopping assistant
const GROCERY_ASSISTANT_SYSTEM_PROMPT = `You are a precise AI grocery shopping assistant for the Danish market. Your task is to analyze a user's request and select the single best product from a provided JSON list of available products.

**Rules for Selection:**
1. Prioritize an exact or close match in the \`Name\` field.
2. Use \`Labels\` and \`Description\` for specifics. For "organic", match "Øko". For "small", match "små". For quantity, check the \`Description\` (e.g., "1 stk.", "550 g.").
3. **Default Choice:** If the user's request is generic (e.g., "banan"), choose the most standard, non-organic option, which is usually the cheapest per unit (\`UnitPriceCalc\`).
4. **Ties:** If multiple products are an equally good match, select the one with the lower \`Price\`.

**CRITICAL OUTPUT REQUIREMENT:**
You MUST respond with ONLY the product ID as a plain string. Do NOT include any explanations, formatting, or additional text. Just the ID number.
`;

// Function to format user prompt with grocery item and product data
function formatUserPrompt(groceryItem, filteredProductData) {
    return `Please select the best product ID for: "${groceryItem}"

Available Products:
${JSON.stringify(filteredProductData, null, 2)}`;
}

// Callback function for initializing progress
function updateEngineInitProgressCallback(report) {
    console.log("initialize", report.progress);
    document.getElementById("download-status").textContent = report.text;
}

// Create engine instance (will be initialized later)
let engine = null;

async function initializeWebLLMEngine() {
    try {
        document.getElementById("download-status").classList.remove("hidden");
        document.getElementById("download-status").textContent = "Initialiserer model...";

        selectedModel = document.getElementById("model-selection").value;

        if (!engine) {
            // Create engine for the first time
            engine = await CreateMLCEngine(selectedModel, {
                initProgressCallback: updateEngineInitProgressCallback,
                temperature: 0.0
            });
        } else {
            // Reload with new model
            const config = {
                temperature: 0.0,
            };
            await engine.reload(selectedModel, config);
        }

        document.getElementById("download-status").textContent = "Model klar til brug!";
        document.getElementById("capture-btn").disabled = false;
        console.log("WebLLM engine initialized successfully");

    } catch (error) {
        console.error("Failed to initialize WebLLM engine:", error);
        document.getElementById("download-status").textContent = `Fejl: ${error.message}`;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const groceryListTextarea = document.getElementById('grocery-list');
    const captureBtn = document.getElementById('capture-btn');
    const status = document.getElementById('status');

    async function getBearerToken() {
        try {
            console.log('Requesting bearer token from Nemlig.com...');
            const response = await fetch('https://www.nemlig.com/webapi/Token', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            console.log('Token response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Token request failed:', response.status, errorText);
                throw new Error(`Token request failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Token response received:', {
                upgraded: data.upgraded,
                token_type: data.token_type,
                expires_in: data.expires_in,
                has_access_token: !!data.access_token
            });

            if (!data.access_token) {
                console.error('No access_token in response:', data);
                throw new Error('No access_token found in response');
            }

            return data.access_token;
        } catch (error) {
            console.error('Failed to get bearer token:', error);
            throw error;
        }
    }

    function generateTimestamp() {
        // Generate timestamp in format: AAAAAAAA-0Hjg_CnJ
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
        let timestamp = 'AAAAAAAA-';
        for (let i = 0; i < 8; i++) {
            timestamp += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return timestamp;
    }

    function generateTimeslotUtc() {
        // Generate timeslot in format: 2025072308-120-600
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        return `${year}${month}${day}${hour}-120-600`;
    }

    function filterProductData(apiResponse) {
        if (!apiResponse.Products || !apiResponse.Products.Products) {
            return {
                Products: { Products: [], NumFound: 0 },
                ProductsNumFound: 0
            };
        }

        const filteredProducts = apiResponse.Products.Products
            .map(product => {
                const filtered = {
                    Id: product.Id,
                    Name: product.Name,
                    Description: product.Description,
                    Availability: {
                        IsAvailableInStock: product.Availability?.IsAvailableInStock || false
                    },
                    Price: product.Price,
                    UnitPriceCalc: product.UnitPriceCalc,
                    UnitPriceLabel: product.UnitPriceLabel,
                    Labels: product.Labels || []
                };

                // Include Campaign data if it exists
                if (product.Campaign) {
                    filtered.Campaign = {
                        MinQuantity: product.Campaign.MinQuantity,
                        TotalPrice: product.Campaign.TotalPrice,
                        CampaignPrice: product.Campaign.CampaignPrice,
                        Type: product.Campaign.Type,
                        DiscountSavings: product.Campaign.DiscountSavings
                    };
                }

                return filtered;
            });

        return {
            Products: {
                Products: filteredProducts,
                NumFound: filteredProducts.length
            },
            ProductsNumFound: filteredProducts.length
        };
    }

    // Populate model selection dropdown
    const modelSelect = document.getElementById("model-selection");
    try {
        availableModels.forEach(modelId => {
            const option = document.createElement("option");
            option.value = modelId;
            option.textContent = modelId;
            if (modelId === selectedModel) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to populate model dropdown:", error);
        // Add a fallback option
        const option = document.createElement("option");
        option.value = selectedModel;
        option.textContent = selectedModel;
        option.selected = true;
        modelSelect.appendChild(option);
    }

    async function sendToLLM(groceryItem, filteredProductData) {
        try {
            if (engine) {
                // Use the actual WebLLM engine
                const userPrompt = formatUserPrompt(groceryItem, filteredProductData);

                const response = await engine.chat.completions.create({
                    messages: [
                        { role: "system", content: GROCERY_ASSISTANT_SYSTEM_PROMPT },
                        { role: "user", content: userPrompt }
                    ]
                });

                let selectedProductId = response.choices[0].message.content.trim();
                
                // Extract only the numeric product ID using regex
                const match = selectedProductId.match(/\d+/);
                selectedProductId = match ? match[0] : selectedProductId;

                console.log('Cleaned product ID:', selectedProductId)

                // Find the selected product for display
                const selectedProduct = filteredProductData.Products.Products.find(p => p.Id === selectedProductId);

                if (selectedProduct) {
                    return `✅ Valgt: ${selectedProduct.Name} (${selectedProduct.Price} kr)`;
                } else {
                    return `⚠️ AI kunne ikke vælge et produkt for "${groceryItem}"`;
                }
            } else {
                return `⚠️ AI agent ikke klar - download først din model`;
            }

        } catch (error) {
            console.error('LLM API error:', error);
            return `Fejl ved analyse af "${groceryItem}": ${error.message}`;
        }
    }

    async function searchGroceryItem(token, item) {
        try {
            const timestamp = generateTimestamp();
            const timeslotUtc = generateTimeslotUtc();

            // Build URL with all required parameters from the website
            const params = new URLSearchParams({
                query: item.trim(),
                take: '20',
                skip: '0',
                recipeCount: '0',
                timestamp: timestamp,
                timeslotUtc: timeslotUtc,
                deliveryZoneId: '1'
            });

            const url = `https://webapi.prod.knl.nemlig.it/searchgateway/api/search?${params.toString()}`;

            console.log(`Searching for "${item}" with URL:`, url);
            console.log('Using token (first 20 chars):', token.substring(0, 20) + '...');

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9,da;q=0.8',
                    'Origin': 'https://www.nemlig.com',
                    'Referer': 'https://www.nemlig.com/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site'
                },
            });

            console.log(`Search response status for "${item}":`, response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Search failed for "${item}":`, response.status, errorText);
                throw new Error(`Search failed for "${item}": ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log(`Search successful for "${item}":`, data?.Products?.Products?.length || 0, 'products found');

            // Filter the product data to essential fields only
            const filteredData = filterProductData(data);
            console.log(`Filtered data for "${item}":`, filteredData);

            // Send to LLM for recommendation
            const llmRecommendation = await sendToLLM(item, filteredData);
            console.log(`LLM recommendation for "${item}":`, llmRecommendation);

            return {
                item,
                data: filteredData,
                llmRecommendation
            };
        } catch (error) {
            console.error(`Failed to search for "${item}":`, error);
            return { item, error: error.message };
        }
    }

    async function captureGroceryList() {
        const groceryText = groceryListTextarea.value.trim();

        if (!groceryText) {
            status.textContent = 'Indtast venligst din indkøbsliste først.';
            status.style.color = '#d73a49';
            return;
        }

        const groceryItems = groceryText.split('\n').filter(item => item.trim() !== '');

        status.textContent = 'Henter token og søger efter varer...';
        status.style.color = '#007bff';

        try {
            // Get bearer token
            const token = await getBearerToken();
            console.log('Bearer token obtained successfully');

            // Search for each grocery item
            const searchResults = [];
            for (let i = 0; i < groceryItems.length; i++) {
                const item = groceryItems[i];
                status.textContent = `Søger efter vare ${i + 1} af ${groceryItems.length}: ${item}`;

                const result = await searchGroceryItem(token, item);
                searchResults.push(result);

                // Log each result to console
                console.log(`Search result for "${item}":`, result);
            }

            // Save to storage - only keep essential data to avoid quota exceeded
            const minimalResults = searchResults.map(result => ({
                item: result.item,
                llmRecommendation: result.llmRecommendation,
                error: result.error,
                productCount: result.data?.ProductsNumFound || 0
            }));

            chrome.storage.sync.set({
                groceryList: groceryItems,
                searchResults: minimalResults,
                lastUpdated: new Date().toISOString()
            }, function () {
                const successCount = searchResults.filter(r => !r.error).length;
                const errorCount = searchResults.filter(r => r.error).length;

                // Display LLM recommendations in status
                let statusMessage = `Søgning færdig! ${successCount} varer analyseret, ${errorCount} fejl\n\nAnbefalinger:\n`;

                searchResults.forEach(result => {
                    if (result.llmRecommendation) {
                        statusMessage += `• ${result.llmRecommendation}\n`;
                    } else if (result.error) {
                        statusMessage += `• Fejl for "${result.item}": ${result.error}\n`;
                    }
                });

                status.textContent = statusMessage;
                status.style.color = errorCount > 0 ? '#ffc107' : '#28a745';
                status.style.whiteSpace = 'pre-wrap'; // Allow line breaks
                status.style.fontSize = '12px'; // Smaller font for more text

                // Log summary to console
                console.log('Search summary:', {
                    successCount,
                    errorCount,
                    results: searchResults,
                    recommendations: searchResults.map(r => r.llmRecommendation).filter(Boolean)
                });

                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    const recommendationCount = searchResults.filter(r => r.llmRecommendation).length;
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'showBanner',
                        message: `AI-anbefalinger klar: ${recommendationCount} produkter analyseret`
                    }, function(response) {
                        if (chrome.runtime.lastError) {
                            console.log('Banner message not sent - content script not available:', chrome.runtime.lastError.message);
                        }
                    });
                });
            });

        } catch (error) {
            console.error('Error during grocery list capture:', error);
            status.textContent = `Fejl: ${error.message}`;
            status.style.color = '#d73a49';
        }
    }

    captureBtn.addEventListener('click', captureGroceryList);

    // Add download button event listener
    document.getElementById('download').addEventListener('click', initializeWebLLMEngine);

    groceryListTextarea.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            captureGroceryList();
        }
    });

    chrome.storage.sync.get(['groceryList'], function (result) {
        if (result.groceryList && result.groceryList.length > 0) {
            groceryListTextarea.value = result.groceryList.join('\n');
            status.textContent = `${result.groceryList.length} varer i din liste`;
            status.style.color = '#666';
        }
    });
});