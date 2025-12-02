# Contributing to ParkChain

Thank you for your interest in contributing to ParkChain! This document provides guidelines for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions with the community.

## How to Contribute

### Reporting Bugs

- Check if the bug has already been reported in Issues
- Use the bug report template
- Include detailed steps to reproduce
- Include relevant logs and screenshots

### Suggesting Enhancements

- Check if the enhancement has already been suggested
- Provide a clear description of the feature
- Explain why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Write or update tests as needed
5. Ensure all tests pass:
   ```bash
   npm test
   ```
6. Commit your changes with clear messages:
   ```bash
   git commit -m "feat: add new parking feature"
   ```
7. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. Create a Pull Request to the `develop` branch

## Development Setup

See the [README.md](README.md) for detailed setup instructions.

## Coding Standards

### Smart Contracts (Solidity)

- Follow the [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use NatSpec comments for all public functions
- Write comprehensive tests for all contract functionality
- Ensure gas optimization where possible

### Backend (TypeScript/Node.js)

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write clear, self-documenting code
- Include JSDoc comments for complex functions

### Frontend (React)

- Use functional components with hooks
- Follow React best practices
- Use Tailwind CSS for styling
- Ensure responsive design
- Write accessible HTML

## Commit Message Guidelines

Use conventional commits format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example: `feat: add QR code scanning feature`

## Testing

- Write unit tests for new features
- Ensure all existing tests pass
- Test on local Hardhat network before submitting PR
- Test frontend changes in multiple browsers

## Documentation

- Update README.md if adding new features
- Add inline comments for complex logic
- Update API documentation if changing endpoints
- Include examples where helpful

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing to ParkChain! 🚗✨
