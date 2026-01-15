
const apiKey = "AIzaSyAvmVAzEucz_bsX9ezVV2jawK5UqAxRkZc";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function run() {
    console.log("Fetching models from:", url.replace(apiKey, "HIDDEN_KEY"));
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.log("Response Status:", response.status);
            console.log("Response Text:", await response.text());
            return;
        }
        const data = await response.json();
        console.log("Models found:");
        if (data.models) {
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
        } else {
            console.log("No models array in response:", data);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

run();
