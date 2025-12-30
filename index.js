const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.get("/profile/:username", async (req, res) => {
  try {
    const username = req.params.username;

    // Username → UserId
    const idRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false
      })
    });
    const idJson = await idRes.json();
    if (!idJson.data || !idJson.data[0])
      return res.json({ error: "User not found" });

    const userId = idJson.data[0].id;

    // User Info
    const userInfo = await fetch(
      `https://users.roblox.com/v1/users/${userId}`
    ).then(r => r.json());

    // Account age
    const createdDate = new Date(userInfo.created);
    const ageDays = Math.floor(
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Currently playing (tidak selalu ada)
    let playing = "Tidak diketahui";
    try {
      const presence = await fetch(
        "https://presence.roblox.com/v1/presence/users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: [userId] })
        }
      ).then(r => r.json());

      if (presence.userPresences && presence.userPresences[0]) {
        playing = presence.userPresences[0].lastLocation || "Offline";
      }
    } catch {}

    res.json({
      username: userInfo.name,
      displayName: userInfo.displayName,
      userId: userId,
      created: userInfo.created,
      accountAgeDays: ageDays,
      bio: userInfo.description || "-",
      playing: playing
    });

  } catch (err) {
    res.json({ error: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("Roblox Profile Proxy Running");
});