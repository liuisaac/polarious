const urlBase64ToUint8Array = base64String => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

const saveSubscription = async (subscription) => {
    const response = await fetch('http://localhost:8080/save-subscription', {
        method: 'post',
        headers: { 'Content-type': "application/json" },
        body: JSON.stringify(subscription)
    })

    return response.json()
}

self.addEventListener("activate", async (e) => {
    const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array("BEtmMjDI1V-07XqGUrl9vQeSuX8XJ0l37h-cDfTxKNqA2cqkWeK_5XD3gPUok1CAbbxvfhdfmwRPj43YAvM_SK0")
    })

    const response = await saveSubscription(subscription)
    console.log(response)
})

self.addEventListener("push", e => {
    const notifications = [
        "Upload it already, we’re bored. 📸",
        "We’re waiting for your pic. 📸",
        "Dont loose the streak, upload a pic. 📸",
        "Happy hacking! 📸"
    ]
    const options = {
        body: "Polaros",
        icon: "image.webp",
        data: {
            url:'http://localhost:8080/upload'
        },
    }
    self.registration.showNotification
    (notifications[Math.floor(Math.random() * notifications.length)]
    , options)
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Close the notification

    // Open the URL specified in the notification data
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

// Public Key:
// BEtmMjDI1V-07XqGUrl9vQeSuX8XJ0l37h-cDfTxKNqA2cqkWeK_5XD3gPUok1CAbbxvfhdfmwRPj43YAvM_SK0

// Private Key:
// -YhQQ8aC3VvHFZZcVrD4vJd03orz28qETMaa96DzACQ