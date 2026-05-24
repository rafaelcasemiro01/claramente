async function sendMessage() {
  const inputField = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const userMessage = inputField.value.trim();
  if (!userMessage) return;

  // Mostra a mensagem do usuário
  chatBox.innerHTML += `<p><b>Você:</b> ${userMessage}</p>`;
  inputField.value = "";

  // Chamada à API Gemini
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + CONFIG.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userMessage }] }]
        })
      }
    );

    const data = await response.json();
    const aiMessage = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui responder.";

    chatBox.innerHTML += `<p><b>Claramente:</b> ${aiMessage}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (error) {
    console.error(error);
    chatBox.innerHTML += `<p><b>Claramente:</b> Erro na conexão com a IA.</p>`;
  }
}

// Permite enviar com a tecla Enter
document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("user-input");
  inputField.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  });
});
