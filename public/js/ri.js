// Copyright IBM Corp. 2025
$(document).ready(async function () {
    const response = await fetch("/config");
    const config = await response.json();
    setupWatsonxAssistant(config);
});

function setupWatsonxAssistant(config) {
    window.watsonAssistantChatOptions = {
        integrationID: config.integrationID, // The ID of this integration.
        region: config.region, // The region your integration is hosted in.
        serviceInstanceID: config.serviceInstanceID, // The ID of your service instance.
        onLoad: async (instance) => { await setupInstance(instance); }
    };
    setTimeout(function () {
        const t = document.createElement('script');
        t.src = "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" + (window.watsonAssistantChatOptions.clientVersion || 'latest') + "/WatsonAssistantChatEntry.js";
        document.head.appendChild(t);
    });
}

async function setupInstance(instance) {
    await instance.render();
    instance.on({ type: 'customResponse', handler: questionHandler });
}


async function questionHandler(event, instance) {
    console.log(event);
    const { element, message } = event.data;
    if( message.hasOwnProperty('user_defined') && message.user_defined.hasOwnProperty('user_query') && message.user_defined.hasOwnProperty('user_defined_type')){
        const query_type = message.user_defined.user_defined_type;
        const query = message.user_defined.user_query;


        const data = {query};
        let result = null;
        element.innerHTML = 'retrieving answer ...';
        try {
            requirements = await DNG.get_module_requirements_async(DNG.get_open_module().ref);
            data['requirements'] = {requirements};
        } catch (error) {
            
        }
        result = await postData('/queryrequirement',data);
        element.innerHTML = result.answer;
    }   
}

async function postData(url, data) {
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify(data),
    });
    return response.json();
  }
