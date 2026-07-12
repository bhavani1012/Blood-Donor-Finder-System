/**
 * Chatbot UI Handler for Blood Donor Finder.
 */
document.addEventListener('DOMContentLoaded', () => {
    const bubble = document.getElementById('chatbot-bubble');
    const windowEl = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close');
    const sendBtn = document.getElementById('chatbot-send');
    const inputField = document.getElementById('chatbot-input');
    const chatBody = document.getElementById('chatbot-body');

    if (!bubble || !windowEl) return;

    // Toggle Chat Window
    bubble.addEventListener('click', () => {
        if (windowEl.style.display === 'none' || windowEl.style.display === '') {
            windowEl.style.display = 'flex';
            // Pre-fill introduction message if chat is empty
            if (chatBody.children.length === 0) {
                appendMessage("bot", "Hello! I am your Blood Donation Assistant. Ask me anything about eligibility criteria, donor-recipient compatibility, updating your GPS location, or emergency contact helplines.");
            }
        } else {
            windowEl.style.display = 'none';
        }
    });

    closeBtn.addEventListener('click', () => {
        windowEl.style.display = 'none';
    });

    // Send message triggers
    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const text = inputField.value.trim();
        if (!text) return;

        // Render User message bubble
        appendMessage("user", text);
        inputField.value = '';

        // Render loading placeholder for Bot reply
        const typingBubble = appendMessage("bot", '<i class="fas fa-spinner fa-spin"></i> Typing...');

        // Fetch query reply from endpoint
        fetch('/api/v1/chatbot/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ message: text })
        })
        .then(res => res.json())
        .then(data => {
            // Replace loader text with formatted reply
            typingBubble.innerHTML = data.reply;
            scrollChatToBottom();
        })
        .catch(() => {
            typingBubble.innerHTML = "I am having trouble connecting right now. Please verify your internet connection or reload the page.";
            scrollChatToBottom();
        });
    }

    function appendMessage(sender, content) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chatbot-message', sender);
        msgDiv.innerHTML = content;
        chatBody.appendChild(msgDiv);
        scrollChatToBottom();
        return msgDiv;
    }

    function scrollChatToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }
});
