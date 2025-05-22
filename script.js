const chatBody = document.querySelector(".chatBody");
const messageInput = document.querySelector(".messageInput");
const sendMessageButton = document.querySelector("#sendMessage");
const fileInput = document.querySelector("#fileInput");
const fileUploadWrapper = document.querySelector(".fileUploadWrapper");
const fileCancelButton = document.querySelector("#fileCancel");




// API setup
const API_KEY = "AIzaSyCcCTlji_1002Lxf59rZmT72xo0CDJZSjg";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const userData = {
  message: null,
  file:{
    data:null,
    mime_type:null
  }
};

const chatHistory=[];
const initialInputHeight=messageInput.scrollHeight;

// Create message element with dynamic classes and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Generate bot response using API
const generateBotResponse = async (IncomingMessageDiv) => {
  const messageElement = IncomingMessageDiv.querySelector(".messageText");

  // add user message  to chat history
  chatHistory.push({
    role:"user",
   parts: [{ text: userData.message }, ...(userData.file.data ?[{inline_data : userData.file}] : [])]
  })


  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents:chatHistory
    }),
  };

  try {
    const response = await fetch(API_URL, requestOptions);
    if (!response.ok) throw new Error("API request failed");
    const data = await response.json();

    const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*/g, "").trim();
    messageElement.innerText = apiResponseText;

    // add bot response to chat history
    chatHistory.push({
      role:"model",
     parts: [{ text: userData.message }]
    })
  } catch (error) {
    console.error("Error:", error);
    messageElement.innerText = error.message;
    messageElement.style.color="#ff0000";

    // messageElement.innerText = "Sorry, something went wrong!";
  }

finally{
  // Remove thinking animation class
  userData.file={};
  IncomingMessageDiv.classList.remove("thinking");
  chatBody.scrollTo({top:chatBody.scrollHeight,behavior:"smooth"});
}
};

// Handle outgoing user messages
const handleOutGoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  if (!userData.message) return;
  messageInput.value = "";
  fileUploadWrapper.classList.remove("fileUploaded");


  // Create and display user message
  const messageContent = `<div class="messageText"></div> ${userData.file.data ?`<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />`:""}`;
  const outGoingMessageDiv = createMessageElement(messageContent, "userMessage");
  outGoingMessageDiv.querySelector(".messageText").textContent = userData.message;
  chatBody.appendChild(outGoingMessageDiv);
  chatBody.scrollTo({top:chatBody.scrollHeight,behavior:"smooth"});

  // Create and display bot message placeholder
  setTimeout(() => {
    const messageContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-robot chatLogoBody" viewBox="0 0 16 16">
        <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.6 26.6 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.93.93 0 0 1-.765.935c-.845.147-2.34.346-4.235.346s-3.39-.2-4.235-.346A.93.93 0 0 1 3 9.219zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a25 25 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25 25 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135"/>
        <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2zM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5"/>
      </svg>        
      <div class="messageText">
        <div class="thinkingIndicator">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>`;

    const IncomingMessageDiv = createMessageElement(
      messageContent,
      "botMessage",
      "thinking"
    );
    chatBody.appendChild(IncomingMessageDiv);
    chatBody.scrollTo({top:chatBody.scrollHeight,behavior:"smooth"});

    // Call API after placeholder is shown
    generateBotResponse(IncomingMessageDiv);
  }, 600);
};

// Handle enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && messageInput.value.trim()) {
    handleOutGoingMessage(e);
  }
});


//adjust input feild height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;

  const newHeight = Math.min(messageInput.scrollHeight, 120); 
  messageInput.style.height = `${newHeight}px`;

  document.querySelector(".chatForm").style.borderRadius =
      messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});
sendMessageButton.addEventListener("click", (e) => handleOutGoingMessage(e));


//file upload button 
fileInput.addEventListener("change",()=>{
  const file=fileInput.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=(e)=>{
    fileUploadWrapper.querySelector("img").src=e.target.result;
    fileUploadWrapper.classList.add("fileUploaded");
    const base64String=e.target.result.split(",")[1];

    //store file data in userData
    userData.file={
      data:base64String,
      mime_type:file.type
    }
    fileInput.value="";
  }
  reader.readAsDataURL(file);
})


document.querySelector("#fileUpload").addEventListener("click",()=>fileInput.click());


//cancel file upload
fileCancelButton.addEventListener("click",()=>{
  userData.file={};
  fileUploadWrapper.classList.remove("fileUploaded");
})

//emoji picker 
const picker = new EmojiMart.Picker({
   theme:"light",
   skinTonePosition:"none",
   previewPosition:"none",
   onEmojiSelect:(emoji)=>{
    const {selectionStart: start,selectionEnd: end}=messageInput;
    messageInput.setRangeText(emoji.native,start,end,"end");
    messageInput.focus();
   },
   onClickOutside: (e)=>{
  if(e.target.id==="emoji-picker"){
    document.body.classList.toggle("show-emoji-picker");
    }
   else{
      document.body.classList.remove("show-emoji-picker");

    }
   }
 });
  document.querySelector(".chatForm").appendChild(picker);
