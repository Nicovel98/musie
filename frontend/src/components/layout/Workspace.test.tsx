import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Workspace } from './Workspace'
import type { CoverLookupProvider, RepeatMode, Track } from '../../types/player'

const mockTrack: Track = {
  id: 'test-1',
  title: 'Test Track',
  artist: 'Test Artist',
  duration: 180,
  src: 'blob:http://localhost:5173/test-audio.mp3',
  coverUrl: undefined,
  coverSource: undefined,
  sizeBytes: 1024,
}

const mockTracks: Track[] = [
  mockTrack,
  { ...mockTrack, id: 'test-2', title: 'Another Track' },
]

const mockProps = {
  activeScreen: 'player' as const,
  themeMode: 'dark' as const,
  libraryViewMode: 'all' as const,
  favoriteCount: 0,
  isDesktopSplitMode: false,
  showDiscoveryDashboard: false,
  screenTitle: 'Now Playing',
  tracks: mockTracks,
  filteredTracks: mockTracks,
  currentTrack: mockTrack,
  isPlaying: false,
  currentTime: 0,
  duration: 180,
  volume: 0.8,
  shuffleEnabled: false,
  repeatMode: 'all' as RepeatMode,
  allowOnlineCoverLookup: false,
  coverLookupProvider: 'auto' as CoverLookupProvider,
  artistFilter: 'all',
  artistOptions: ['Test Artist'],
  searchQuery: '',
  isTrackFavorite: () => false,
  onOpenScreen: vi.fn(),
  onShowAllTracks: vi.fn(),
  onShowFavorites: vi.fn(),
  onToggleTheme: vi.fn(),
  onAddMusic: vi.fn(),
  onSelectTrack: vi.fn(),
  onPrev: vi.fn(),
  onTogglePlay: vi.fn(),
  onNext: vi.fn(),
  onSeek: vi.fn(),
  onVolumeChange: vi.fn(),
  onToggleShuffle: vi.fn(),
  onCycleRepeat: vi.fn(),
  onToggleTrackFavorite: vi.fn(),
  onToggleOnlineCoverLookup: vi.fn(),
  onCoverLookupProviderChange: vi.fn(),
  onSearchChange: vi.fn(),
  onArtistFilterChange: vi.fn(),
  onImportFiles: vi.fn(),
  onClearQueue: vi.fn(),
}

describe('Workspace', () => {
  it('renders without crashing', () => {
    render(<Workspace {...mockProps} />)
    expect(screen.getByLabelText('Navigation sidebar')).toBeInTheDocument()
  })

  it('renders desktop layout with sidebar menu', () => {
    render(<Workspace {...mockProps} />)
    const sidebar = screen.getByLabelText('Navigation sidebar')
    expect(sidebar).toBeInTheDocument()
    expect(sidebar.querySelector('.sidebar-branding-label')).toHaveTextContent('Musie')
  })

  it('renders sidebar buttons for navigation', () => {
    render(<Workspace {...mockProps} />)
    const sidebar = screen.getByLabelText('Navigation sidebar')
    expect(sidebar.querySelector('button:nth-of-type(1)')).toHaveTextContent('Now Playing')
    expect(sidebar.querySelector('button:nth-of-type(2)')).toHaveTextContent('Library')
    expect(sidebar.querySelector('button:nth-of-type(3)')).toHaveTextContent('Queue')
  })

  it('renders mobile header with screen title', () => {
    render(<Workspace {...mockProps} screenTitle="Library" />)
    const headers = screen.getAllByText('Musie')
    expect(headers.length).toBeGreaterThan(0)
  })

  it('renders mobile navigation tabs', () => {
    render(<Workspace {...mockProps} />)
    const mobileNav = screen.getByLabelText('Primary navigation')
    expect(mobileNav).toBeInTheDocument()
    const buttons = Array.from(mobileNav.querySelectorAll('button'))
    expect(buttons.length).toBe(3)
  })

  it('renders active screen with is-active class on mobile nav', () => {
    const { rerender } = render(<Workspace {...mockProps} activeScreen="library" />)
    
    let libraryButtons = screen.getAllByRole('button', { name: 'Library' })
    let activeButton = libraryButtons.find(btn => btn.className.includes('is-active'))
    expect(activeButton).toBeInTheDocument()

    rerender(<Workspace {...mockProps} activeScreen="queue" />)
    let queueButtons = screen.getAllByRole('button', { name: 'Queue' })
    activeButton = queueButtons.find(btn => btn.className.includes('is-active'))
    expect(activeButton).toBeInTheDocument()
  })

  it('renders sidebar Add Music button', () => {
    render(<Workspace {...mockProps} />)
    expect(screen.getByRole('button', { name: /\+ Add Music/i })).toBeInTheDocument()
  })

  it('renders theme toggle button with emoji', () => {
    render(<Workspace {...mockProps} themeMode="dark" />)
    const themeBtn = screen.getAllByRole('button').find(btn => 
      btn.textContent?.includes('☀️') || btn.textContent?.includes('🌙')
    )
    expect(themeBtn).toBeInTheDocument()
  })

  it('displays favorite count in sidebar', () => {
    render(<Workspace {...mockProps} favoriteCount={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('calls onOpenScreen when navigation button is clicked', () => {
    const onOpenScreen = vi.fn()
    render(<Workspace {...mockProps} onOpenScreen={onOpenScreen} />)
    
    const libButtons = screen.getAllByRole('button', { name: 'Library' })
    libButtons[0].click()
    
    expect(onOpenScreen).toHaveBeenCalled()
  })

  it('calls onToggleTheme when theme button is clicked', () => {
    const onToggleTheme = vi.fn()
    render(<Workspace {...mockProps} onToggleTheme={onToggleTheme} />)
    
    const buttons = screen.getAllByRole('button')
    const themeBtn = buttons.find(btn => 
      btn.textContent?.includes('☀️') || btn.textContent?.includes('🌙')
    )
    
    themeBtn?.click()
    expect(onToggleTheme).toHaveBeenCalled()
  })

  it('calls onAddMusic when Add Music button is clicked', () => {
    const onAddMusic = vi.fn()
    render(<Workspace {...mockProps} onAddMusic={onAddMusic} />)
    
    screen.getByRole('button', { name: /\+ Add Music/i }).click()
    expect(onAddMusic).toHaveBeenCalled()
  })

  it('renders discovery dashboard when showDiscoveryDashboard is true', () => {
    render(
      <Workspace 
        {...mockProps} 
        showDiscoveryDashboard={true} 
        activeScreen="library"
      />
    )
    expect(screen.getByLabelText('Current screen')).toBeInTheDocument()
  })

  it('shows desktop stage when showDiscoveryDashboard is false', () => {
    const { container } = render(
      <Workspace 
        {...mockProps} 
        showDiscoveryDashboard={false}
      />
    )
    const stage = container.querySelector('.desktop-stage')
    expect(stage).toBeInTheDocument()
  })

  it('renders queue panel when activeScreen is queue on desktop', () => {
    render(
      <Workspace 
        {...mockProps} 
        activeScreen="queue"
        showDiscoveryDashboard={false}
      />
    )
    const queueElements = screen.getAllByLabelText('Queue')
    expect(queueElements.length).toBeGreaterThan(0)
  })

  it('renders library panel when activeScreen is library on desktop', () => {
    render(
      <Workspace 
        {...mockProps} 
        activeScreen="library"
        showDiscoveryDashboard={false}
      />
    )
    const libraryElements = screen.getAllByLabelText('Library')
    expect(libraryElements.length).toBeGreaterThan(0)
  })

  it('applies split mode class when isDesktopSplitMode is true', () => {
    const { container } = render(
      <Workspace 
        {...mockProps} 
        isDesktopSplitMode={true}
        showDiscoveryDashboard={false}
      />
    )
    const stage = container.querySelector('.desktop-stage.is-split-mode')
    expect(stage).toBeInTheDocument()
  })

  it('renders mobile screen sections with is-visible class for active screen', () => {
    render(
      <Workspace 
        {...mockProps} 
        activeScreen="library"
      />
    )
    const libraryScreens = Array.from(
      document.querySelectorAll('.mobile-screen-library.is-visible')
    )
    expect(libraryScreens.length).toBeGreaterThan(0)
  })
})
