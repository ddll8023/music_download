import argparse

from flask import Flask, jsonify
from flask_cors import CORS
from blueprint.song import song_bp


def create_app():
    app = Flask(__name__)
    CORS(
        app,
        origins=["http://localhost:3493"],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "token"],
        methods=["GET", "POST", "OPTIONS"],
        expose_headers=["Content-Type", "Access-Control-Allow-Origin"],
    )

    app.register_blueprint(song_bp)

    @app.route("/health")
    def health():
        return jsonify({"status": "ok"})

    return app


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Music Download Backend")
    parser.add_argument("--port", type=int, default=3492, help="Flask 服务端口")
    parser.add_argument("--debug", action="store_true", help="启用调试模式")
    args = parser.parse_args()

    app = create_app()
    app.run(port=args.port, debug=args.debug)
