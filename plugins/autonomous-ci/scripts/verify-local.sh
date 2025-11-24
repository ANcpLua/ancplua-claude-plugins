#!/bin/bash
# Local verification before pushing
# Auto-detects project type and runs appropriate tests

set -e

echo "🔍 Running local verification..."
echo ""

# Detect project type
if compgen -G "*.sln" > /dev/null || compgen -G "*.csproj" > /dev/null; then
  PROJECT_TYPE="dotnet"
elif [ -f "package.json" ]; then
  PROJECT_TYPE="node"
elif [ -f "requirements.txt" ] || [ -f "setup.py" ] || [ -f "pyproject.toml" ]; then
  PROJECT_TYPE="python"
elif [ -f "go.mod" ]; then
  PROJECT_TYPE="go"
else
  echo "⚠️  Unknown project type. Please run tests manually."
  exit 1
fi

echo "📦 Detected project type: $PROJECT_TYPE"
echo ""

# Run tests based on project type
case $PROJECT_TYPE in
  dotnet)
    echo "📦 Building .NET solution..."
    if compgen -G "*.sln" > /dev/null; then
      dotnet build -- *.sln --configuration Release
    else
      dotnet build --configuration Release
    fi
    echo "✅ Build passed"
    echo ""

    echo "🧪 Running .NET tests..."
    if compgen -G "*.sln" > /dev/null; then
      dotnet test -- *.sln --no-build --configuration Release --verbosity normal
    else
      dotnet test --no-build --configuration Release --verbosity normal
    fi
    echo "✅ All tests passed"
    ;;

  node)
    echo "📦 Installing dependencies..."
    npm ci --quiet || npm install --quiet
    echo "✅ Dependencies installed"
    echo ""

    if grep -q '"build"' package.json; then
      echo "📦 Building project..."
      npm run build
      echo "✅ Build passed"
      echo ""
    fi

    echo "🧪 Running Node.js tests..."
    npm test
    echo "✅ All tests passed"
    ;;

  python)
    echo "🧪 Running Python tests..."
    if command -v pytest &> /dev/null; then
      pytest
    elif command -v python -m pytest &> /dev/null; then
      python -m pytest
    else
      python -m unittest discover
    fi
    echo "✅ All tests passed"
    ;;

  go)
    echo "🧪 Running Go tests..."
    go test ./... -v
    echo "✅ All tests passed"
    ;;
esac

echo ""
echo "✨ All local verifications passed! Safe to push."
