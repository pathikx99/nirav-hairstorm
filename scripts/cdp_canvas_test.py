import asyncio
import json
import urllib.request
import websockets
import base64
import os
import time

async def cdp_call(ws, method, params=None, msg_id=1):
    payload = {"id": msg_id, "method": method, "params": params or {}}
    await ws.send(json.dumps(payload))
    while True:
        resp = await ws.recv()
        data = json.loads(resp)
        if data.get("id") == msg_id:
            return data.get("result", {})

async def main():
    # 1. Get websocket URL
    res = urllib.request.urlopen("http://localhost:9222/json/list").read()
    pages = json.loads(res.decode("utf-8"))
    page = next(p for p in pages if p.get("type") == "page" and "starting-hair" in p.get("url", ""))
    ws_url = page["webSocketDebuggerUrl"]
    print("Connecting to:", ws_url)
    
    async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
        # Enable runtime & DOM
        await cdp_call(ws, "Runtime.enable", msg_id=1)
        
        # Wait 3 seconds for avatar canvas to finish loading textures and render
        print("Waiting for avatar canvas to initialize...")
        await asyncio.sleep(4)
        
        # Check canvas existence
        eval_res = await cdp_call(ws, "Runtime.evaluate", {
            "expression": "document.querySelectorAll('canvas').length"
        }, msg_id=2)
        print("Canvas count on page:", eval_res.get("result", {}).get("value"))
        
        # Find skin tone buttons
        btn_eval = await cdp_call(ws, "Runtime.evaluate", {
            "expression": "Array.from(document.querySelectorAll('button')).filter(b => b.title && b.title.includes('Skin Tone')).map(b => b.title)"
        }, msg_id=3)
        print("Skin buttons found:", btn_eval.get("result", {}).get("value"))
        
        os.makedirs("frontend/public/diagnostics_p3/cdp_renders", exist_ok=True)
        
        tones = ["Porcelain", "Fair", "Light", "Warm Beige", "Medium", "Olive", "Tan", "Caramel", "Deep", "Ebony"]
        
        for idx, tone in enumerate(tones):
            # Click button
            click_expr = f"""
            (() => {{
                const btn = Array.from(document.querySelectorAll("button")).find(b => b.title && b.title.includes("{tone}"));
                if (btn) {{
                    btn.click();
                    return "Clicked " + btn.title;
                }}
                return "Not found";
            }})()
            """
            click_res = await cdp_call(ws, "Runtime.evaluate", {"expression": click_expr}, msg_id=100 + idx)
            print(f"[{tone}] {click_res.get('result', {}).get('value')}")
            
            # Wait for canvas render
            await asyncio.sleep(0.5)
            
            # Extract canvas data URL
            data_expr = """
            (() => {
                const canvas = document.querySelector("canvas");
                if (!canvas) return null;
                return canvas.toDataURL("image/png");
            })()
            """
            data_res = await cdp_call(ws, "Runtime.evaluate", {"expression": data_expr}, msg_id=200 + idx)
            data_url = data_res.get("result", {}).get("value")
            
            if data_url and data_url.startswith("data:image/png;base64,"):
                b64 = data_url.split(",")[1]
                img_data = base64.b64decode(b64)
                out_path = f"frontend/public/diagnostics_p3/cdp_renders/{tone.lower().replace(' ', '_')}.png"
                with open(out_path, "wb") as f:
                    f.write(img_data)
                print(f"Saved {out_path} ({len(img_data)} bytes)")
            else:
                print(f"Failed to get data URL for {tone}")

if __name__ == "__main__":
    asyncio.run(main())
