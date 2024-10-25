let currentQuestionIndex = 0;  // Yeh variable current question ka index rakhta hai
let illnessDetected = false;    // Yeh variable illness detect hone ka status rakhta hai
let chatWindowOpen = false;     // Yeh variable chat window khuli hai ya nahi, yeh track karta hai

document.getElementById('sendBtn').addEventListener('click', function() {  // Send button par click hone par event listener
    const chatWindow = document.getElementById('chatbotWindow');  // Chat window ka element lena
    chatWindow.style.display = chatWindow.style.display === 'none' || chatWindow.style.display === '' ? 'flex' : 'none';  // Chat window ka display toggle karna
    chatWindowOpen = chatWindow.style.display === 'flex';  // Check karna ke chat window khuli hai ya nahi
    if (chatWindowOpen) {  // Agar chat window khuli hai to focus karna
        document.getElementById('chatInput').focus();
    }
});

document.getElementById('sendMessageBtn').addEventListener('click', handleSend);  // Send message button par click hone par handleSend function call karna
document.getElementById('chatInput').addEventListener('keypress', function(event) {  // Chat input par key press hone par event listener
    if (event.key === 'Enter') {  // Agar pressed key 'Enter' hai
        event.preventDefault();  // Default action ko rokena
        handleSend();  // HandleSend function call karna
    }
});

document.getElementById('userForm').addEventListener('submit', async function(event) {  // User form submit hone par event listener
    event.preventDefault();  // Default form submission ko rokena
    const userData = collectUserData(); // User data collect karne ke liye function call karna

    const response = await fetch('/submit_form', {  // Form data submit karne ke liye fetch request
        method: 'POST',  // HTTP method ko POST set karna
        headers: { 'Content-Type': 'application/json' },  // Headers ko set karna
        body: JSON.stringify(userData)  // User data ko JSON format mein convert karke body mein dalna
    });

    if (response.ok) {  // Agar response sahi hai
        const clientName = userData.clientName;  // Client name ko user data se lena
        document.querySelector('.thank-you').style.display = 'block';  // Thank you message ko dikhana
        document.getElementById('chatInput').value = `Hi ${clientName}! How can I assist you today?`;  // Chat input mein greeting message dalna
        handleSend();  // HandleSend function call karna
    } else {
        console.error('Form submission failed');  // Agar form submission fail hota hai, console mein error message dalna
    }
});

async function handleSend() {  // Function jo user message bhejne ke liye hai
    const userMessage = document.getElementById('chatInput').value.trim();  // User message ko input field se lena
    const chatWindow = document.getElementById('chatBody');  // Chat body ka element lena

    if (!chatWindowOpen || !userMessage) {  // Agar chat window nahi khuli ya user message khaali hai
        return;  // Function se exit karna
    }

    chatWindow.innerHTML += `<div class="message user-message">You: ${sanitizeInput(userMessage)}</div>`;  // User message ko chat window mein add karna
    document.getElementById('chatInput').value = '';  // Input field ko khaali karna
    const loadingMessage = document.createElement('div');  // Loading message ka naya element banana
    loadingMessage.innerText = 'Bot: ...';  // Loading message set karna
    chatWindow.appendChild(loadingMessage);  // Loading message ko chat window mein add karna

    try {
        const response = await fetch('/get_response', {  // Bot response lene ke liye fetch request
            method: 'POST',  // HTTP method ko POST set karna
            headers: { 'Content-Type': 'application/json' },  // Headers ko set karna
            body: JSON.stringify({ message: userMessage })  // User message ko JSON format mein body mein dalna
        });

        if (!response.ok) throw new Error('Network response was not ok');  // Agar response sahi nahi hai, error throw karna

        const data = await response.json();  // Response ko JSON format mein convert karna
        chatWindow.removeChild(loadingMessage);  // Loading message ko chat window se hataana
        typeMessage(formatResponse(data.response), chatWindow);  // Bot ka response type karne ke liye typeMessage function call karna
        
        // Agar recommendation link hai
        if (data.link) {
            const linkDiv = document.createElement('div');  // Link ka naya element banana
            linkDiv.style.color = 'blue';  // Link ka color blue set karna
            linkDiv.style.textDecoration = 'underline';  // Link ka underline decoration set karna
            linkDiv.style.cursor = 'pointer';  // Cursor ko pointer set karna
            linkDiv.innerHTML = data.link;  // Link ka text set karna
            chatWindow.appendChild(linkDiv);  // Link ko chat window mein add karna
        }

        // Agar recommendation di gayi hai to question index aur flags reset karna
        if (data.response.includes('recommend')) {
            currentQuestionIndex = 0;  // Current question index ko reset karna
            illnessDetected = false;  // Illness detected flag ko reset karna
        }
    } catch (error) {
        console.error('Error fetching response:', error);  // Agar error aaye to console mein error message dalna
        chatWindow.removeChild(loadingMessage);  // Loading message ko chat window se hataana
        chatWindow.innerHTML += `<div class="message bot-message">Bot: Sorry, there was an error processing your request.</div>`;  // Error message dikhana
    }
}

function collectUserData() {  // Function jo user data collect karta hai
    const clientName = document.getElementById('clientName').value.trim();  // Client name lena
    const counsellorName = document.getElementById('counsellorName').value.trim();  // Counsellor name lena
    const mobile = document.getElementById('mobile').value.trim();  // Mobile number lena
    const heightFeet = document.getElementById('feet').value.trim();  // Height (feet) lena
    const heightInches = document.getElementById('inches').value.trim();  // Height (inches) lena
    const weight = document.getElementById('weight').value.trim();  // Weight lena
    const age = document.getElementById('age').value.trim();  // Age lena
    const sleepTime = document.getElementById('sleepTime').value;  // Sleep time lena
    const wakeTime = document.getElementById('wakeTime').value;  // Wake time lena
    const location = document.getElementById('location').value.trim();  // Location lena
    const maritalStatus = document.querySelector('input[name="maritalStatus"]:checked').value;  // Marital status lena
    const geneticDisorder = document.querySelector('input[name="genetic_disorder"]:checked').value === 'yes'  // Agar genetic disorder 'yes' hai
        ? document.getElementById('disorder').value.trim()  // Toh disorder detail lena
        : 'None';  // Agar 'no' hai toh 'None' set karna

    return {  // User data ko return karna
        clientName,
        counsellorName,
        mobile,
        height: `${heightFeet} feet ${heightInches} inches`,  // Height ko format karna
        weight,
        age,
        sleepTime,
        wakeTime,
        location,
        maritalStatus,
        geneticDisorder
    };
}

function formatResponse(response) {  // Function jo response format karta hai
    return response;  // Response ko waise hi return karna
}

function typeMessage(message, chatWindow) {  // Function jo message ko type karke dikhata hai
    const botMessageDiv = document.createElement('div');  // Bot message ka naya element banana
    botMessageDiv.className = 'message bot-message';  // Class name set karna
    chatWindow.appendChild(botMessageDiv);  // Bot message element ko chat window mein add karna

    let index = 0;  // Index ko 0 se initialize karna
    const typingSpeed = 5; // Typing speed set karna

    function type() {  // Inner function jo message type karne ka kaam karta hai
        if (index < message.length) {  // Agar abhi message ka length baki hai
            botMessageDiv.innerHTML += message.charAt(index);  // Message ka current character add karna
            index++;  // Index ko increment karna
            chatWindow.scrollTop = chatWindow.scrollHeight;  // Chat window ko scroll karna
            setTimeout(type, typingSpeed);  // Typing delay set karna
        }
    }

    type();  // Typing function ko call karna
}

function sanitizeInput(input) {  // Function jo user input ko sanitize karta hai
    return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');  // Special characters ko replace karna
}
