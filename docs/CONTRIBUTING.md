# Contributing to T0kenRent

Thank you for your interest in contributing to T0kenRent! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Contributions](#making-contributions)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- Git
- MongoDB (for full development)
- BSV wallet with Babbage SDK support

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/T0kenRent.git
cd T0kenRent
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/ChibiTech/T0kenRent.git
```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
MONGODB_URI="mongodb://localhost:27017/t0kenrent"
NETWORK="test" # Use testnet for development
OVERLAY_URL="https://overlay-us-1.bsvb.tech"
```

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Enable Mock Mode (Optional)

For development without real BSV transactions:

```bash
MOCK_PAYMENTS=true npm run dev
```

## Making Contributions

### Types of Contributions

We welcome various types of contributions:

- **Bug Fixes**: Fix issues and bugs
- **Features**: Implement new features
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve tests
- **Performance**: Optimize performance
- **Security**: Fix security vulnerabilities

### Finding Issues

- Check [GitHub Issues](https://github.com/ChibiTech/T0kenRent/issues) for open issues
- Look for issues labeled `good first issue` for beginner-friendly tasks
- Issues labeled `help wanted` are especially valuable

### Creating Issues

Before creating a new issue:

1. Search existing issues to avoid duplicates
2. Use issue templates when available
3. Provide detailed information:
- Clear description of the problem/feature
- Steps to reproduce (for bugs)
- Expected behavior
- Screenshots if applicable
- Environment details

## Pull Request Process

### 1. Create a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Test additions

### 2. Make Changes

- Write clean, readable code
- Follow the [coding standards](#coding-standards)
- Add/update tests as needed
- Update documentation

### 3. Commit Changes

Follow conventional commit format:

```bash
git commit -m "type(scope): description"
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```bash
git commit -m "feat(escrow): add dispute resolution flow"
git commit -m "fix(http402): handle expired payment references"
git commit -m "docs(api): add escrow release endpoint documentation"
```

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title describing the change
- Detailed description of what was changed and why
- Reference to related issues (`Fixes #123`)
- Screenshots for UI changes

### 5. Code Review

- Address reviewer feedback
- Keep discussions respectful and constructive
- Update PR as needed

### 6. Merge

Once approved:
- Squash commits if requested
- Ensure CI passes
- Maintainer will merge

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define interfaces for all data structures
- Use meaningful variable names

```typescript
// Good
interface RentalAsset {
tokenId: string;
name: string;
rentalRatePerDay: number;
}

async function createAsset(data: Partial<RentalAsset>): Promise<RentalAsset> {
// ...
}

// Avoid
const x: any = {};
function f(d) { /* ... */ }
```

### React/Next.js

- Use functional components with hooks
- Keep components focused and reusable
- Use TypeScript for props

```tsx
interface AssetCardProps {
asset: RentalAsset;
onSelect: (id: string) => void;
}

export function AssetCard({ asset, onSelect }: AssetCardProps) {
return (
<div onClick={() => onSelect(asset.tokenId)}>
{asset.name}
</div>
);
}
```

### Styling

- Use Tailwind CSS
- Follow utility-first approach
- Extract common patterns to components

```tsx
// Good
<button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
Click me
</button>

// For repeated patterns, create a component
export function Button({ children, ...props }) {
return (
<button 
className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
{...props}
>
{children}
</button>
);
}
```

### API Routes

- Validate all inputs
- Handle errors gracefully
- Return consistent response formats
- Use appropriate HTTP status codes

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== 'POST') {
return res.status(405).json({ error: 'Method not allowed' });
}

try {
const { name, amount } = req.body;

if (!name || !amount) {
return res.status(400).json({ error: 'Missing required fields' });
}

const result = await processRequest(name, amount);

return res.status(200).json({ success: true, data: result });
} catch (error) {
console.error('Handler error:', error);
return res.status(500).json({ error: 'Internal server error' });
}
}
```

### Error Handling

- Use try-catch for async operations
- Provide meaningful error messages
- Log errors with context

```typescript
try {
await riskyOperation();
} catch (error) {
console.error('Operation failed:', { error, context: { userId, assetId } });
throw new Error(`Failed to process: ${getErrorMessage(error)}`);
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.ts

# Run e2e tests
npm run test:e2e
```

### Writing Tests

- Write tests for new features
- Maintain existing tests
- Aim for meaningful coverage

```typescript
describe('HTTP402Modal', () => {
it('should display payment amount', () => {
render(<HTTP402Modal asset={mockAsset} />);
expect(screen.getByText('0.0001 BSV')).toBeInTheDocument();
});

it('should call onSuccess after payment verification', async () => {
const onSuccess = jest.fn();
render(<HTTP402Modal asset={mockAsset} onSuccess={onSuccess} />);

await userEvent.click(screen.getByRole('button', { name: /pay/i }));

await waitFor(() => {
expect(onSuccess).toHaveBeenCalled();
});
});
});
```

## Documentation

### Code Comments

- Comment complex logic
- Use JSDoc for function documentation
- Keep comments up to date

```typescript
/**
* Creates a 2-of-2 multisig escrow for rental deposits.
* 
* @param ownerKey - Public key of the asset owner
* @param renterKey - Public key of the renter
* @param amount - Total escrow amount (deposit + rental fee)
* @returns Escrow contract details including address and script
*/
async function createEscrow(
ownerKey: string,
renterKey: string,
amount: number
): Promise<EscrowContract> {
// Implementation
}
```

### Documentation Files

- Update README.md for significant changes
- Add/update API documentation in docs/api.md
- Document new features in appropriate files

## Questions?

- Open a [GitHub Discussion](https://github.com/ChibiTech/T0kenRent/discussions)
- Join our [Discord](https://discord.gg/tokenrent)
- Email: contribute@tokenrent.io

---

Thank you for contributing to T0kenRent! Your efforts help build the future of decentralized rentals.
