import dotenv from "dotenv";
dotenv.config();

import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_TOKEN;   // Yeh .env ya Render env se token lega

if (!token) {
  console.error("❌ Telegram Bot Token not provided!");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Bot chal raha hai ✅");
});
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const express = require('express');

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Express server for keep-alive
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(3000, () => console.log('Server started'));

// /start command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "👋 Hello! I am Movie Bot.\nUse /movie <movie name> to search movies.\nUse /favorite to save your favorite movies.");
});

// /movie command
bot.onText(/\/movie (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];

    try {
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
        const response = await axios.get(url);
        const movie = response.data.results[0];

        if (movie) {
            const message = `🎬 *Title:* ${movie.title}\n🗓 *Release:* ${movie.release_date}\n⭐ *Rating:* ${movie.vote_average}\n📖 *Overview:* ${movie.overview}`;
            
            // Inline buttons for Poster & Trailer
            const buttons = [
                [{ text: "View Poster", url: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }],
                [{ text: "Watch Trailer", url: `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + " trailer")}` }]
            ];

            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } });
        } else {
            await bot.sendMessage(chatId, "❌ Movie not found!");
        }
    } catch (error) {
        console.error(error);
        await bot.sendMessage(chatId, "⚠ Error fetching movie info.");
    }
});

// /favorite command example (save last searched movie to Supabase)
let lastMovie = {}; // store last movie searched per chat

bot.onText(/\/movie (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];
    try {
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
        const response = await axios.get(url);
        const movie = response.data.results[0];
        if (movie) lastMovie[chatId] = movie;
    } catch {}
});

bot.onText(/\/favorite/, async (msg) => {
    const chatId = msg.chat.id;
    const movie = lastMovie[chatId];
    if (!movie) return bot.sendMessage(chatId, "❌ No recent movie to save. Use /movie <name> first.");

    try {
        await supabase.from('favorites').insert([{ chat_id: chatId, movie_id: movie.id, title: movie.title }]);
        bot.sendMessage(chatId, `✅ Movie "${movie.title}" saved to favorites!`);
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "⚠ Error saving to favorites.");
    }
});
