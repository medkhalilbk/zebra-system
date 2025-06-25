import asyncio
import random
import json
import threading
from datetime import datetime

class ZebraFX9600Simulator:
    def __init__(self):
        self.running = False
        self.thread = None
        self.reader_name = "FX9600FB37EE FX9600 RFID Reader"
        self.mac_address = "84:24:8D:EF:B2:F6"

    def generate_tag(self):
        now = datetime.now()
        timestamp = f"{now.day}/{now.month}/{now.year} {now.hour}:{now.minute}:{now.second}:{now.microsecond // 1000}"
        return {
            "epc": f"{random.randint(10000000000000000000000000, 99999999999999999999999999):024X}",
            "pc": "3000",
            "antennaPort": str(random.randint(1, 4)),
            "peakRssi": str(random.randint(-70, -40)),
            "seenCount": str(random.randint(1, 5)),
            "timeStamp": timestamp,
            "phase": "0.00",
            "channelIndex": str(random.randint(1, 4)),
            "isHeartBeat": "false"
        }

    def generate_payload(self, tag_count):
        return {
            "reader_name": self.reader_name,
            "mac_address": self.mac_address,
            "tag_reads": [self.generate_tag() for _ in range(tag_count)]
        }

    def _run(self, tag_count, interval, broadcast_func):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        async def emit_loop():
            while self.running:
                payload = self.generate_payload(tag_count)
                await broadcast_func(json.dumps(payload))
                await asyncio.sleep(interval)

        loop.run_until_complete(emit_loop())

    def start_simulation(self, tag_count, interval, broadcast_func):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(
            target=self._run,
            args=(tag_count, interval, broadcast_func),
            daemon=True
        )
        self.thread.start()

    def stop_simulation(self):
        self.running = False
        if self.thread:
            self.thread.join()
            self.thread = None
