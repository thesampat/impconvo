// Application State
let activeTab = 'simple-chat';
let chatHistory = [];
let currentContext = '';
let currentScenario = '';
let hasApiKey = false;

// DOM Elements
const navSimpleChat = document.getElementById('nav-simple-chat');
const navGetOpeners = document.getElementById('nav-get-openers');
const simpleChatTab = document.getElementById('simple-chat-tab');
const getOpenersTab = document.getElementById('get-openers-tab');

// Active Chat View Elements
const chatThreadView = document.getElementById('chat-thread-view');
const chatScenarioDesc = document.getElementById('chat-scenario-desc');
const chatHistoryViewport = document.getElementById('chat-history-viewport');
const chatMessageInput = document.getElementById('chat-message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const resetChatBtn = document.getElementById('drawer-end-scenario-btn');

// Sidebar Drawer Elements
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const sidebarDrawer = document.getElementById('sidebar-drawer');
const sidebarDrawerOverlay = document.getElementById('sidebar-drawer-overlay');
const closeDrawerBtn = document.getElementById('close-drawer-btn');

// Settings & Config
const apiStatusBadge = document.getElementById('api-status');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const modelSelect = document.getElementById('model-select');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

const toast = document.getElementById('toast');

// Vibe Review DOM Elements
const vibeReviewBtn = document.getElementById('vibe-review-btn');
const vibeReviewModal = document.getElementById('vibe-review-modal');
const vibeReviewBody = document.getElementById('vibe-review-body');
const closeVibeModalBtn = document.getElementById('close-vibe-modal-btn');
const closeVibeFooterBtn = document.getElementById('close-vibe-footer-btn');

// Composer Suggestions DOM Elements
const getSuggestionsBtn = document.getElementById('get-suggestions-btn');
const composerSuggestionsBox = document.getElementById('composer-suggestions-box');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchConfig();
    setupEventListeners();
    checkOpenersDeepLink();
});

// Setup Event Listeners
function setupEventListeners() {
    // Navigation Tabs
    // Navigation tabs are handled by native anchors and drawer toggle hooks
    
    // Active Chat Sending
    sendMessageBtn.addEventListener('click', handleSendMessage);
    chatMessageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Reset Scenario
    resetChatBtn.addEventListener('click', handleResetScenario);

    // Settings Modal
    settingsBtn.addEventListener('click', () => {
        closeDrawer();
        settingsModal.classList.remove('hidden');
    });
    
    const hideSettings = () => settingsModal.classList.add('hidden');
    closeModalBtn.addEventListener('click', hideSettings);
    cancelSettingsBtn.addEventListener('click', hideSettings);
    saveSettingsBtn.addEventListener('click', saveConfig);

    // Sidebar Drawer Toggle Events
    console.log("Binding toggle drawer elements:", {menuToggleBtn, closeDrawerBtn, sidebarDrawerOverlay});
    menuToggleBtn.addEventListener('click', (e) => {
        console.log("Menu toggle button clicked!", e);
        openDrawer();
    });
    closeDrawerBtn.addEventListener('click', closeDrawer);
    sidebarDrawerOverlay.addEventListener('click', closeDrawer);
    navSimpleChat.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('simple-chat');
        closeDrawer();
    });

    // Composer Text Suggestions Trigger
    getSuggestionsBtn.addEventListener('click', handleGetComposerSuggestions);

    // Vibe Review Modal Toggle Events
    vibeReviewBtn.addEventListener('click', () => {
        closeDrawer();
        handleGetVibeReview();
    });
    const hideVibeModal = () => vibeReviewModal.classList.add('hidden');
    closeVibeModalBtn.addEventListener('click', hideVibeModal);
    closeVibeFooterBtn.addEventListener('click', hideVibeModal);
}

// Fetch Backend Configuration
async function fetchConfig() {
    try {
        const res = await fetch('/api/config');
        const data = await res.json();
        
        hasApiKey = data.has_key;
        updateApiKeyStatus(hasApiKey);
        
        if (data.model_name && modelSelect) {
            modelSelect.value = data.model_name;
        }
    } catch (e) {
        console.error('Error fetching Config settings:', e);
        updateApiKeyStatus(false);
    }
}

function updateApiKeyStatus(active) {
    if (active) {
        apiStatusBadge.className = 'api-status-dot active';
        apiStatusBadge.title = 'Gemini Active';
    } else {
        apiStatusBadge.className = 'api-status-dot key-missing';
        apiStatusBadge.title = 'API Key Required';
    }
}

async function saveConfig() {
    const model = modelSelect ? modelSelect.value : 'gemini-2.5-flash';
    
    saveSettingsBtn.innerText = 'Saving...';
    saveSettingsBtn.disabled = true;
    
    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_name: model })
        });
        
        if (res.ok) {
            settingsModal.classList.add('hidden');
            showToast('Configuration updated!');
            fetchConfig(); // Reload state
        } else {
            alert('Failed to save settings.');
        }
    } catch (e) {
        console.error('Error saving settings:', e);
        alert('Error communicating with the backend.');
    } finally {
        saveSettingsBtn.innerText = 'Save Configuration';
        saveSettingsBtn.disabled = false;
    }
}

// Switch navigation tabs
function switchTab(tabId) {
    activeTab = tabId;
    if (tabId === 'simple-chat') {
        navSimpleChat.classList.add('active');
        simpleChatTab.classList.add('active');
        getOpenersTab.classList.remove('active');
    }
}

// Reset Roleplay scenario
function handleResetScenario() {
    chatHistory = [];
    currentContext = '';
    currentScenario = '';
    chatMessageInput.value = '';
    
    // Reset scenario label text
    chatScenarioDesc.innerText = 'Type your first message (with context prefix, e.g. "I found this girl\'s bag in coffee shop. hey how are you") to start texting!';
    
    renderMessages();
    resetChatBtn.classList.add('hidden');
    vibeReviewBtn.classList.add('hidden');
    composerSuggestionsBox.classList.add('hidden');
    closeDrawer();
}

// Send Message in Roleplay
async function handleSendMessage() {
    const rawText = chatMessageInput.value.trim();
    const text = tryExtractTextMessage(rawText);
    if (!text) return;

    // Dismiss composer suggestions box on send
    composerSuggestionsBox.classList.add('hidden');

    // Check if this is the first message in the chat
    const isFirstSend = chatHistory.length === 0;

    // If it's not the first send, append the user bubble immediately
    if (!isFirstSend) {
        const userMsg = {
            sender: 'Me',
            body: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        chatHistory.push(userMsg);
        chatMessageInput.value = '';
        renderMessages();
    } else {
        // Clear composer for first send
        chatMessageInput.value = '';
    }

    // Disable composer during processing
    setComposerDisabledState(true);
    appendThinkingIndicator();

    try {
        if (isFirstSend) {
            // First send handles context parsing / scenario generation
            const res = await fetch('/api/initiate-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_first_input: text })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Failed initiating chat.');
            }

            const data = await res.json();

            // Set context/scenario
            currentContext = data.context;
            currentScenario = data.scenario;
            chatScenarioDesc.innerText = data.scenario;

            // Load user first message (cleaned) and partner's reply
            chatHistory = [
                {
                    sender: 'Me',
                    body: data.cleaned_user_message,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                },
                {
                    sender: 'Them',
                    body: tryExtractTextMessage(data.partner_reply),
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ];

            removeThinkingIndicator();
            renderMessages();
            resetChatBtn.classList.remove('hidden'); // Show End Scenario in drawer
            vibeReviewBtn.classList.remove('hidden'); // Show Vibe Review inside drawer

        } else {
            // Normal message exchange
            const res = await fetch('/api/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: currentContext,
                    scenario: currentScenario,
                    chat_history: chatHistory.slice(0, -1),
                    message: text
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Failed generating next message.');
            }

            const data = await res.json();
            
            removeThinkingIndicator();

            chatHistory.push({
                sender: 'Them',
                body: tryExtractTextMessage(data.reply),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            renderMessages();
        }

    } catch (e) {
        console.error(e);
        removeThinkingIndicator();
        alert(e.message || 'Error processing chat message.');
        // If first send failed, reset history to empty
        if (isFirstSend) {
            chatHistory = [];
            renderMessages();
        }
    } finally {
        setComposerDisabledState(false);
    }
}



// Disable/Enable Inputs helper
function setComposerDisabledState(disabled) {
    chatMessageInput.disabled = disabled;
    sendMessageBtn.disabled = disabled;
    if (!disabled) {
        chatMessageInput.focus();
    }
}

// Append thinking bubble
function appendThinkingIndicator() {
    const row = document.createElement('div');
    row.className = 'message-bubble-row them thinking-bubble';
    row.innerHTML = `
        <div class="msg-header">Partner is typing...</div>
        <div class="msg-content-wrapper">
            <div class="msg-bubble" style="display:flex; align-items:center; gap:8px;">
                <div class="spinner" style="width:12px; height:12px; margin:0;"></div>
                <span>Drafting message...</span>
            </div>
        </div>
    `;
    chatHistoryViewport.appendChild(row);
    chatHistoryViewport.scrollTop = chatHistoryViewport.scrollHeight;
}

// Remove thinking bubble
function removeThinkingIndicator() {
    const loader = chatHistoryViewport.querySelector('.thinking-bubble');
    if (loader) {
        loader.remove();
    }
}

// Render dynamic chat bubbles
function renderMessages() {
    chatHistoryViewport.innerHTML = '';
    
    chatHistory.forEach((msg, idx) => {
        const isMe = msg.sender === 'Me';
        const row = document.createElement('div');
        row.className = `message-bubble-row ${isMe ? 'me' : 'them'}`;
        row.innerHTML = `
            <div class="msg-header">${escapeHtml(msg.sender === 'Me' ? 'You' : 'Partner')} • ${msg.timestamp}</div>
            <div class="msg-content-wrapper">
                <div class="msg-bubble">${escapeHtml(msg.body)}</div>
                ${isMe ? `
                <div class="msg-actions">
                    <button class="bubble-action-btn improve-btn-trigger" title="Improve this message" onclick="improveMyMessage(${idx})">
                        ✨
                    </button>
                </div>
                ` : ''}
            </div>
            <div id="alternatives-box-${idx}" class="alternatives-box hidden"></div>
        `;
        chatHistoryViewport.appendChild(row);
    });

    // Toggle the Get Vibe Review button based on user message history
    const hasUserMessages = chatHistory.some(msg => msg.sender === 'Me');
    if (hasUserMessages) {
        vibeReviewBtn.classList.remove('hidden');
    } else {
        vibeReviewBtn.classList.add('hidden');
    }

    chatHistoryViewport.scrollTop = chatHistoryViewport.scrollHeight;
}

// Helper: toast notifications
function showToast(message) {
    toast.innerText = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

// Helper: Escape HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Helper: Try to extract a clean string from a structured message payload (e.g. JSON or Python dict strings)
function tryExtractTextMessage(input) {
    if (!input) return '';
    const trimmed = input.trim();
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
            const regex = /['"]text['"]\s*:\s*(['"])(.*?)\1/s;
            const match = trimmed.match(regex);
            if (match && match[2]) {
                return match[2]
                    .replace(/\\'/g, "'")
                    .replace(/\\"/g, '"')
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r');
            }
        } catch (e) {
            console.warn("Failed extracting structured text:", e);
        }
    }
    return input;
}

// Call API to improve a sent message in the thread
async function improveMyMessage(index) {
    const msg = chatHistory[index];
    const popover = document.getElementById(`alternatives-box-${index}`);
    if (!popover) return;
    
    // Toggle popover visibility if already open
    if (!popover.classList.contains('hidden')) {
        popover.classList.add('hidden');
        return;
    }
    
    popover.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; padding:10px 0; color:var(--text-muted); font-size:12px;">
            <div class="spinner" style="width:12px; height:12px; margin:0;"></div>
            <span>Coach is rewriting...</span>
        </div>
    `;
    popover.classList.remove('hidden');
    
    // Send previous history preceding the target message
    const precedingHistory = chatHistory.slice(0, index);
    
    try {
        const res = await fetch('/api/improve-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                context: currentContext,
                scenario: currentScenario,
                chat_history: precedingHistory,
                message_to_improve: msg.body
            })
        });
        
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || 'Failed getting options');
        }
        
        const data = await res.json();
        
        // Render 3 alternatives buttons
        popover.innerHTML = `
            <div class="alternatives-list">
                <div class="alt-title">💫 AI Alternatives:</div>
                ${(Array.isArray(data.alternatives) ? data.alternatives : []).map((alt, i) => {
                    const text = (typeof alt === 'object' && alt !== null) ? (alt.text || '') : alt;
                    return `
                        <button class="alt-option-btn" onclick="replaceMessageText(${index}, '${escapeHtmlForJs(text)}')">
                            "${escapeHtml(text)}"
                        </button>
                    `;
                }).join('')}
            </div>
        `;
        
    } catch (e) {
        console.error(e);
        popover.innerHTML = `<div style="color:#ef4444; font-size:12px; padding:8px 0;">Error: ${escapeHtml(e.message)}</div>`;
    }
}

function replaceMessageText(index, newText) {
    chatHistory[index].body = newText;
    renderMessages();
    showToast('Message replaced!');
}

function escapeHtmlForJs(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(/"/g, '\\"')
         .replace(/\n/g, '\\n')
         .replace(/\r/g, '\\r');
}

// Fetch Post-Chat Vibe Review Report from Gemini
async function handleGetVibeReview() {
    vibeReviewBody.innerHTML = `
        <div class="loading-scenario" style="padding: 40px 0;">
            <div class="spinner-large"></div>
            <h3>Generating Vibe Report...</h3>
            <p>Gemini is assessing your texting flow and generating comparisons...</p>
        </div>
    `;
    vibeReviewModal.classList.remove('hidden');
    
    try {
        const res = await fetch('/api/vibe-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                context: currentContext,
                scenario: currentScenario,
                chat_history: chatHistory
            })
        });
        
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || 'Failed generation.');
        }
        
        const data = await res.json();
        renderVibeReviewReport(data);
        
    } catch (e) {
        console.error(e);
        vibeReviewBody.innerHTML = `
            <div style="text-align:center; padding: 40px 0; color:#ef4444;">
                <span style="font-size:40px;">⚠️</span>
                <h3>Review Generation Failed</h3>
                <p style="margin-top:10px;">${escapeHtml(e.message)}</p>
            </div>
        `;
    }
}

function renderVibeReviewReport(data) {
    vibeReviewBody.innerHTML = `
        <div class="vibe-review-header-card">
            <div class="vibe-score-circle">
                <span class="score-num">${data.score}</span>
                <span class="score-lbl">Vibe Score</span>
            </div>
            <div class="vibe-feedback-box">
                <h4>Vibe Analysis Feedback</h4>
                <p>${escapeHtml(data.overall_feedback)}</p>
            </div>
        </div>
        
        <div class="vibe-comparison-section">
            <h3>💬 Side-by-Side Vibe Improvements</h3>
            <div class="vibe-comparison-list" style="margin-top:12px;">
                ${data.comparisons.map((item, idx) => `
                    <div class="vibe-comparison-row">
                        <div class="vibe-col">
                            <div class="vibe-col-header user-label">Your Message</div>
                            <div class="vibe-bubble-preview user-bubble">${escapeHtml(item.original_message)}</div>
                        </div>
                        <div class="vibe-col">
                            <div class="vibe-col-header ai-label">AI Coaching Alternative</div>
                            <div class="vibe-bubble-preview ai-bubble">${escapeHtml(item.improved_message)}</div>
                            <div class="vibe-bubble-explanation">${escapeHtml(item.explanation)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function openDrawer() {
    console.log("openDrawer triggered!");
    if (!sidebarDrawer || !sidebarDrawerOverlay) {
        console.error("Drawer elements missing:", {sidebarDrawer, sidebarDrawerOverlay});
        return;
    }
    sidebarDrawer.classList.remove('closed');
    sidebarDrawerOverlay.classList.remove('hidden');
    console.log("Drawer classes after opening:", sidebarDrawer.className, sidebarDrawerOverlay.className);
}

function closeDrawer() {
    console.log("closeDrawer triggered!");
    if (!sidebarDrawer || !sidebarDrawerOverlay) {
        console.error("Drawer elements missing:", {sidebarDrawer, sidebarDrawerOverlay});
        return;
    }
    sidebarDrawer.classList.add('closed');
    sidebarDrawerOverlay.classList.add('hidden');
    console.log("Drawer classes after closing:", sidebarDrawer.className, sidebarDrawerOverlay.className);
}

// Get composer alternatives before sending
async function handleGetComposerSuggestions() {
    // If the composer suggestions box is visible, toggle it closed
    if (!composerSuggestionsBox.classList.contains('hidden')) {
        composerSuggestionsBox.classList.add('hidden');
        return;
    }

    const currentText = chatMessageInput.value.trim();
    // Show spinner in composer suggestions box
    composerSuggestionsBox.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; padding: 12px; gap: 8px;">
            <div class="spinner"></div>
            <span style="font-size: 11px; color: var(--text-muted);">Coaching texting alternatives...</span>
        </div>
    `;
    composerSuggestionsBox.classList.remove('hidden');

    try {
        const res = await fetch('/api/improve-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                context: currentContext || 'Casual conversation',
                scenario: currentScenario || 'Witty texting exchange',
                chat_history: chatHistory,
                message_to_improve: currentText || 'generate a response'
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.detail || 'Could not fetch alternatives.');
        }

        const data = await res.json();
        
        // Render alternatives inside the box (flat list, no labels or explanations)
        composerSuggestionsBox.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 6px;">
                <span class="alt-title" style="color: var(--primary);">✨ Suggestions</span>
                <button class="close-btn" style="font-size: 14px; background: transparent; border: none; color: var(--text-muted); cursor: pointer;" onclick="document.getElementById('composer-suggestions-box').classList.add('hidden')">&times;</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
                ${(Array.isArray(data.alternatives) ? data.alternatives : []).map((alt, idx) => {
                    const text = (typeof alt === 'object' && alt !== null) ? (alt.text || '') : alt;
                    return `
                        <button class="alt-option-btn" data-index="${idx}" style="width: 100%; text-align: left; padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); color: #fff; cursor: pointer; font-size: 13.5px; transition: var(--transition);">
                            "${escapeHtml(text)}"
                        </button>
                    `;
                }).join('')}
            </div>
        `;

        // Add event listeners to the generated suggestion buttons
        const optionBtns = composerSuggestionsBox.querySelectorAll('.alt-option-btn');
        optionBtns.forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                const alt = data.alternatives[idx];
                const text = (typeof alt === 'object' && alt !== null) ? (alt.text || '') : alt;
                chatMessageInput.value = text;
                composerSuggestionsBox.classList.add('hidden');
                chatMessageInput.focus();
            });
        });

    } catch (e) {
        console.error(e);
        composerSuggestionsBox.innerHTML = `
            <div style="padding: 8px; color: var(--danger-color); font-size: 11px; text-align: center;">
                ⚠️ ${escapeHtml(e.message || 'Failed generating suggestions.')}
            </div>
        `;
    }
}

// Check deep-linked openers from the openers page
async function checkOpenersDeepLink() {
    const preOpener = sessionStorage.getItem('pre_opener');
    const preContext = sessionStorage.getItem('pre_context');
    
    if (preOpener && preContext) {
        // Clear immediately so reload does not loop
        sessionStorage.removeItem('pre_opener');
        sessionStorage.removeItem('pre_context');
        
        // Populate input field with the combined context + opener text
        const combinedInput = `${preContext}\n${preOpener}`;
        chatMessageInput.value = combinedInput;
        
        // Trigger sending
        console.log("Deep link opener detected, starting chat automatically...");
        handleSendMessage();
    }
}


