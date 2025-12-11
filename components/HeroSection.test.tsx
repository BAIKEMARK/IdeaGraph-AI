import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from './HeroSection';

describe('HeroSection Component', () => {
  it('should display hero section when show prop is true', () => {
    const mockOnGetStarted = vi.fn();
    render(<HeroSection show={true} onGetStarted={mockOnGetStarted} />);
    
    // Check if the main title is present
    expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
    expect(screen.getByText(/IdeaGraph/i)).toBeInTheDocument();
  });

  it('should not display hero section when show prop is false', () => {
    const mockOnGetStarted = vi.fn();
    const { container } = render(<HeroSection show={false} onGetStarted={mockOnGetStarted} />);
    
    // The component should return null, so container should be empty
    expect(container.firstChild).toBeNull();
  });

  it('should display CTA button', () => {
    const mockOnGetStarted = vi.fn();
    render(<HeroSection show={true} onGetStarted={mockOnGetStarted} />);
    
    // Check if the Get Started button is present
    const ctaButton = screen.getByRole('button', { name: /Get Started/i });
    expect(ctaButton).toBeInTheDocument();
  });

  it('should call onGetStarted when CTA button is clicked', () => {
    const mockOnGetStarted = vi.fn();
    render(<HeroSection show={true} onGetStarted={mockOnGetStarted} />);
    
    // Click the Get Started button
    const ctaButton = screen.getByRole('button', { name: /Get Started/i });
    fireEvent.click(ctaButton);
    
    // Verify the callback was called
    expect(mockOnGetStarted).toHaveBeenCalledTimes(1);
  });

  it('should display feature highlights', () => {
    const mockOnGetStarted = vi.fn();
    render(<HeroSection show={true} onGetStarted={mockOnGetStarted} />);
    
    // Check if all three feature highlights are present
    expect(screen.getByText('Capture Ideas')).toBeInTheDocument();
    expect(screen.getByText('Visualize Connections')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Insights')).toBeInTheDocument();
  });

  it('should display feature descriptions', () => {
    const mockOnGetStarted = vi.fn();
    render(<HeroSection show={true} onGetStarted={mockOnGetStarted} />);
    
    // Check if feature descriptions are present
    expect(screen.getByText(/Transform raw thoughts into structured knowledge graphs/i)).toBeInTheDocument();
    expect(screen.getByText(/See how your ideas relate and form patterns/i)).toBeInTheDocument();
    expect(screen.getByText(/Chat with AI to explore and refine your concepts/i)).toBeInTheDocument();
  });

  it('should display scroll hint', () => {
    const mockOnGetStarted = vi.fn();
    render(<HeroSection show={true} onGetStarted={mockOnGetStarted} />);
    
    // Check if scroll hint is present
    expect(screen.getByText(/Scroll to explore/i)).toBeInTheDocument();
  });

  it('should update visibility when show prop changes', () => {
    const mockOnGetStarted = vi.fn();
    const { rerender, container } = render(<HeroSection show={true} onGetStarted={mockOnGetStarted} />);
    
    // Initially should be visible
    expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
    
    // Change show prop to false
    rerender(<HeroSection show={false} onGetStarted={mockOnGetStarted} />);
    
    // Should not be visible anymore
    expect(container.firstChild).toBeNull();
  });
});
