"""QQ 音乐二维码登录脚本"""
import asyncio
import json
import os

from qqmusic_api import Client
from qqmusic_api.models.login import QRLoginType, QRCodeLoginEvents


def show_qrcode(qr):
    """显示二维码"""
    try:
        from io import BytesIO

        from PIL import Image
        from pyzbar.pyzbar import decode
        from qrcode import QRCode

        img = Image.open(BytesIO(qr.data))
        url = decode(img)[0].data.decode("utf-8")
        qr_terminal = QRCode()
        qr_terminal.add_data(url)
        qr_terminal.print_ascii()
    except ImportError:
        save_path = qr.save()
        print(f"二维码已保存至: {save_path}")


async def qrcode_login(login_type: QRLoginType):
    """二维码登录"""
    try:
        async with Client() as client:
            qr = await client.login.get_qrcode(login_type)
            print(f"获取 {login_type.name} 二维码成功")

            show_qrcode(qr)

            while True:
                result = await client.login.check_qrcode(qr)
                print(f"当前状态: {result.event.name}")

                if result.event == QRCodeLoginEvents.DONE:
                    print(f"登录成功! MusicID: {result.credential.musicid}")
                    return result.credential
                if result.event == QRCodeLoginEvents.TIMEOUT:
                    print("二维码已过期,请重新获取")
                    break
                if result.event == QRCodeLoginEvents.SCAN:
                    await asyncio.sleep(5)
                else:
                    await asyncio.sleep(2)

    except Exception as e:
        print(f"登录失败: {e!s}")
        raise


async def main():
    print("请选择登录方式:")
    print("1. QQ")
    print("2. WX")

    choice = input("请输入选项 (1/2): ").strip()

    if choice == "1":
        credential = await qrcode_login(QRLoginType.QQ)
    elif choice == "2":
        credential = await qrcode_login(QRLoginType.WX)
    else:
        print("无效的选项")
        return

    credential_json = credential.model_dump_json()
    print(credential_json)
    with open(
        os.path.join(os.path.dirname(__file__), "credential.json"),
        "w",
        encoding="utf-8",
    ) as f:
        f.write(credential_json)


if __name__ == "__main__":
    asyncio.run(main())
