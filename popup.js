import { WebLLMService } from './services/webllm.js';
import { NemligAPIService } from './services/nemlig-api.js';
import { generateTimestamp, generateTimeslotUtc, filterProductData, createMinimalResults, generateStatusMessage } from './utils/helpers.js';

const webllmService = new WebLLMService();
const nemligService = new NemligAPIService();

function updateEngineInitProgressCallback(report) {
    console.log("initialize", report.progress);
    document.getElementById("download-status").textContent = report.text;
}

async function initializeWebLLMEngine() {
    try {
        document.getElementById("download-status").classList.remove("hidden");
        document.getElementById("download-status").textContent = "Initialiserer model...";

        const selectedModel = document.getElementById("model-selection").value;
        const result = await webllmService.initializeEngine(selectedModel, updateEngineInitProgressCallback);

        if (result.success) {
            document.getElementById("download-status").textContent = "Model klar til brug!";
            document.getElementById("capture-btn").disabled = false;
            console.log("WebLLM engine initialized successfully");
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error("Failed to initialize WebLLM engine:", error);
        document.getElementById("download-status").textContent = `Fejl: ${error.message}`;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const groceryListTextarea = document.getElementById('grocery-list');
    const captureBtn = document.getElementById('capture-btn');
    const status = document.getElementById('status');


    // Populate model selection dropdown
    const modelSelect = document.getElementById("model-selection");
    try {
        const availableModels = webllmService.getAvailableModels();
        const currentModel = webllmService.getCurrentModel();
        
        availableModels.forEach(modelId => {
            const option = document.createElement("option");
            option.value = modelId;
            option.textContent = modelId;
            if (modelId === currentModel) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to populate model dropdown:", error);
        const option = document.createElement("option");
        option.value = webllmService.getCurrentModel();
        option.textContent = webllmService.getCurrentModel();
        option.selected = true;
        modelSelect.appendChild(option);
    }

    async function sendToLLM(groceryItem, filteredProductData, token) {
        try {
            if (!webllmService.isEngineReady()) {
                return `⚠️ AI agent ikke klar - download først din model`;
            }

            const { productId, product } = await webllmService.selectProduct(groceryItem, filteredProductData);

            if (product) {
                const basketResult = await nemligService.addToBasket(token, productId);
                
                if (basketResult.success) {
                    return `✅ Tilføjet til kurv: ${product.Name} (${product.Price} kr)`;
                } else {
                    return `⚠️ Valgt men ikke tilføjet: ${product.Name} - ${basketResult.error}`;
                }
            } else {
                return `⚠️ AI kunne ikke vælge et produkt for "${groceryItem}"`;
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

            const data = await nemligService.searchProduct(token, item, timestamp, timeslotUtc);
            const filteredData = filterProductData(data);
            console.log(`Filtered data for "${item}":`, filteredData);

            const llmRecommendation = await sendToLLM(item, filteredData, token);
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
            const token = await nemligService.getBearerToken();
            console.log('Bearer token obtained successfully');

            const searchResults = [];
            for (let i = 0; i < groceryItems.length; i++) {
                const item = groceryItems[i];
                status.textContent = `Søger efter vare ${i + 1} af ${groceryItems.length}: ${item}`;

                const result = await searchGroceryItem(token, item);
                searchResults.push(result);

                console.log(`Search result for "${item}":`, result);
            }

            const minimalResults = createMinimalResults(searchResults);

            chrome.storage.sync.set({
                groceryList: groceryItems,
                searchResults: minimalResults,
                lastUpdated: new Date().toISOString()
            }, function () {
                const successCount = searchResults.filter(r => !r.error).length;
                const errorCount = searchResults.filter(r => r.error).length;
                const basketSuccessCount = searchResults.filter(r => 
                    r.llmRecommendation && r.llmRecommendation.includes('Tilføjet til kurv')
                ).length;
                
                const statusMessage = generateStatusMessage(searchResults);

                status.textContent = statusMessage;
                status.style.color = errorCount > 0 ? '#ffc107' : '#28a745';
                status.style.whiteSpace = 'pre-wrap';
                status.style.fontSize = '12px';

                console.log('Search summary:', {
                    successCount,
                    errorCount,
                    results: searchResults,
                    recommendations: searchResults.map(r => r.llmRecommendation).filter(Boolean)
                });

                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'showBanner',
                        message: `AI-shopping afsluttet: ${basketSuccessCount} produkter tilføjet til kurv`
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