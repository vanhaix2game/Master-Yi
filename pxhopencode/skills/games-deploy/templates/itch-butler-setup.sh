# Cài đặt itch-butler trên máy local
# Dùng để push game lên Itch.io thủ công

# macOS
brew install butler

# Linux / Windows (WSL)
curl -L -o butler.zip https://broth.itch.ovh/butler/linux-amd64/LATEST/archive/default
unzip butler.zip -d butler
sudo mv butler/butler /usr/local/bin/butler
rm -rf butler butler.zip

# Login
butler login

# Push
# butler push dist/ user/game:web
