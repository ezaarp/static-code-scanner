from app import create_app

app = create_app()

if __name__ == "__main__":
    # Gunakan localhost untuk konsistensi
    app.run(debug=True, host="localhost", port=5000)
