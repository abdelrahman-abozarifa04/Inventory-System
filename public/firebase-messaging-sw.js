/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker
// This file MUST be in the public directory at the root

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Initialize Firebase in the service worker
// NOTE: Replace with your actual Firebase config
firebase.initializeApp({
  apiKey: "your_api_key_here",
  authDomain: "your_project_id.firebaseapp.com",
  projectId: "your_project_id_here",
  storageBucket: "your_project_id.firebasestorage.app",
  messagingSenderId: "your_sender_id_here",
  appId: "your_app_id_here",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message:", payload);

  const notificationTitle = payload.notification?.title || "Dental Clinic Alert";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification.",
    icon: "/dental-icon.png",
    badge: "/dental-badge.png",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
