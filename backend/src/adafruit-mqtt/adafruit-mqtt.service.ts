import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class AdafruitMqttService implements OnModuleInit, OnModuleDestroy {
    private readonly AIO_USERNAME = 'leduy1204'; // Thay bằng username Adafruit IO
    private readonly AIO_KEY = 'aio_geGY19NFH3nv6m1rAj3unlge1M1q'; // Thay bằng API Key của Adafruit IO
    private readonly MQTT_URL = `mqtts://${this.AIO_USERNAME}:${this.AIO_KEY}@io.adafruit.com`;

    private client: mqtt.MqttClient;
    private latestFeedValues: { [key: string]: string } = {};

    onModuleInit() {
        // Kết nối đến MQTT Broker của Adafruit IO
        this.client = mqtt.connect(this.MQTT_URL);

        this.client.on('connect', () => {
            console.log('✅ Connected to Adafruit MQTT');
        });

        // Nhận dữ liệu từ feed và lưu vào biến latestFeedValues
        this.client.on('message', (topic, message) => {
            const feedName = topic.split('/').pop() || 'cambien1';
            this.latestFeedValues[feedName] = message.toString();            
            console.log(`📩 Received data from ${feedName}: ${this.latestFeedValues[feedName]}`);
        });

        this.client.on('error', (err) => {
            console.error('❌ MQTT Error:', err);
        });
    }

    // Đăng ký (subscribe) nhận dữ liệu từ feed cụ thể
    subscribeToFeed(feedName: string) {
        const topic = `${this.AIO_USERNAME}/feeds/${feedName}`;
        this.client.subscribe(topic, (err) => {
            if (err) console.error(`❌ Failed to subscribe to ${topic}`, err);
            else console.log(`📡 Subscribed to ${topic}`);
        });
    }

    // Gửi dữ liệu lên MQTT
    sendMessage(feedName: string, value: string) {
        const topic = `${this.AIO_USERNAME}/feeds/${feedName}`;
        this.client.publish(topic, value, {}, (err) => {
            if (err) console.error(`❌ Failed to publish to ${topic}`, err);
            else console.log(`📤 Sent value ${value} to ${topic}`);
        });
    }

    // Lấy dữ liệu mới nhất từ feed
    getLatestFeedValue(feedName: string): string | null {
        return this.latestFeedValues[feedName] || null;
    }

    onModuleDestroy() {
        this.client.end();
    }
}
