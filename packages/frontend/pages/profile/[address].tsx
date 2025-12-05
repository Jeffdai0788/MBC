import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileSidebar from "../../components/profile/ProfileSidebar";
import ProfileControls from "../../components/profile/ProfileControls";
import ProfileTabs from "../../components/profile/ProfileTabs";
import BulkActionBar from "../../components/profile/BulkActionBar";
import StrategyCard from "../../components/StrategyCard";
import { useProfileBrowser } from "../../hooks/useProfileBrowser";
import { mockStrategies } from "../../lib/mockStrategyData"; // Using mock data for now

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

interface UserProfile {
    walletAddress: string;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
    joinedDate: string;
    privacySetting: string;
    followersCount: number;
    followingCount: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const { address } = router.query;
    const { publicKey } = useWallet();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [activeView, setActiveView] = useState<"trader" | "developer">("trader");
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Edit form state
    const [editForm, setEditForm] = useState({
        username: "",
        bio: "",
        avatarUrl: "",
        apiKey: "",
        secret: "",
        passphrase: ""
    });

    // Browser state hook
    const { state: browserState, filteredItems, actions: browserActions } = useProfileBrowser(activeView, mockStrategies);

    const isOwnProfile = publicKey?.toBase58() === address;

    useEffect(() => {
        if (address) {
            fetchProfileData();
        }
    }, [address]);

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            const profileRes = await fetch(`${SERVER_URL}/api/profile/${address}`);
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setProfile(profileData);
                setEditForm({
                    username: profileData.username || "",
                    bio: profileData.bio || "",
                    avatarUrl: profileData.avatarUrl || "",
                    apiKey: "",
                    secret: "",
                    passphrase: ""
                });
            }

            if (publicKey && !isOwnProfile) {
                const followRes = await fetch(
                    `${SERVER_URL}/api/social/is-following/${publicKey.toBase58()}/${address}`
                );
                if (followRes.ok) {
                    const { isFollowing: following } = await followRes.json();
                    setIsFollowing(following);
                }
            }
        } catch (e) {
            console.error("Error fetching profile:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!publicKey) return;
        try {
            await fetch(`${SERVER_URL}/api/profile/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    walletAddress: publicKey.toBase58(),
                    username: editForm.username,
                    bio: editForm.bio,
                    avatarUrl: editForm.avatarUrl
                })
            });

            if (editForm.apiKey && editForm.secret && editForm.passphrase) {
                await fetch(`${SERVER_URL}/api/user/profile`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        walletAddress: publicKey.toBase58(),
                        apiKey: editForm.apiKey,
                        secret: editForm.secret,
                        passphrase: editForm.passphrase
                    })
                });
            }

            setIsEditing(false);
            fetchProfileData();
        } catch (e) {
            console.error("Error saving profile:", e);
        }
    };

    const handleFollow = async () => {
        if (!publicKey) return;
        try {
            await fetch(`${SERVER_URL}/api/social/follow`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    followerAddress: publicKey.toBase58(),
                    followingAddress: address
                })
            });
            setIsFollowing(true);
            if (profile) {
                setProfile({ ...profile, followersCount: profile.followersCount + 1 });
            }
        } catch (e) {
            console.error("Error following:", e);
        }
    };

    const handleUnfollow = async () => {
        if (!publicKey) return;
        try {
            await fetch(`${SERVER_URL}/api/social/unfollow/${address}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ followerAddress: publicKey.toBase58() })
            });
            setIsFollowing(false);
            if (profile) {
                setProfile({ ...profile, followersCount: Math.max(0, profile.followersCount - 1) });
            }
        } catch (e) {
            console.error("Error unfollowing:", e);
        }
    };

    const handleBulkAction = (action: string) => {
        console.log(`Performing bulk action: ${action} on items:`, browserState.selectedItems);
        // Implement actual logic here
        browserActions.handleClearSelection();
    };

    // Calculate counts
    const counts = React.useMemo(() => {
        const c: any = {
            active: 0, paused: 0, listed: 0, unlisted: 0,
            politics: 0, crypto: 0, sports: 0, entertainment: 0
        };

        mockStrategies.forEach(s => {
            // Status counts
            if (c[s.status] !== undefined) c[s.status]++;

            // Category counts
            const cat = s.category.toLowerCase();
            if (c[cat] !== undefined) c[cat]++;
        });

        return c;
    }, []);

    if (loading) return <div className="loading">Loading profile...</div>;
    if (!profile) return <div className="error">Profile not found</div>;

    return (
        <div className="profile-page">
            <ProfileHeader
                profile={profile}
                isOwnProfile={isOwnProfile}
                isFollowing={isFollowing}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onEdit={() => setIsEditing(!isEditing)}
            />

            {/* ... (Edit Profile Section and View Toggle remain same) ... */}

            {/* Edit Profile Section */}
            {isEditing && isOwnProfile && (
                <div className="edit-section">
                    {/* ... (edit form content) ... */}
                    <h2>Edit Profile</h2>
                    <div className="edit-form">
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={editForm.username}
                                onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                                placeholder="Enter username"
                            />
                        </div>
                        <div className="form-group">
                            <label>Bio</label>
                            <textarea
                                value={editForm.bio}
                                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                placeholder="Tell us about yourself"
                                rows={3}
                            />
                        </div>
                        <div className="form-group">
                            <label>Avatar URL</label>
                            <input
                                type="text"
                                value={editForm.avatarUrl}
                                onChange={e => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

                        <hr className="divider" />
                        <h3>Polymarket API Keys</h3>
                        <p className="form-desc">Connect your Polymarket account to enable automated trading</p>

                        <div className="form-group">
                            <label>API Key</label>
                            <input
                                type="text"
                                value={editForm.apiKey}
                                onChange={e => setEditForm({ ...editForm, apiKey: e.target.value })}
                                placeholder="Enter API Key"
                            />
                        </div>
                        <div className="form-group">
                            <label>API Secret</label>
                            <input
                                type="password"
                                value={editForm.secret}
                                onChange={e => setEditForm({ ...editForm, secret: e.target.value })}
                                placeholder="Enter Secret"
                            />
                        </div>
                        <div className="form-group">
                            <label>Passphrase</label>
                            <input
                                type="password"
                                value={editForm.passphrase}
                                onChange={e => setEditForm({ ...editForm, passphrase: e.target.value })}
                                placeholder="Enter Passphrase"
                            />
                        </div>

                        <div className="form-actions">
                            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveProfile}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Toggle */}
            <div className="view-toggle-main">
                <button
                    className={`toggle-btn ${activeView === "trader" ? "active" : ""}`}
                    onClick={() => setActiveView("trader")}
                >
                    Trader Profile
                </button>
                <button
                    className={`toggle-btn ${activeView === "developer" ? "active" : ""}`}
                    onClick={() => setActiveView("developer")}
                >
                    Developer Profile
                </button>
            </div>

            <ProfileTabs
                activeTab={browserState.activeTab}
                onTabChange={browserActions.handleTabChange}
                mode={activeView}
            />

            <div className="profile-content-layout">
                {/* Sidebar */}
                {isSidebarOpen && (
                    <ProfileSidebar
                        filters={browserState.filters}
                        onFilterChange={browserActions.handleFilterChange}
                        mode={activeView}
                        counts={counts}
                    />
                )}

                {/* Main Content */}
                <div className="profile-main-content">
                    <ProfileControls
                        searchQuery={browserState.searchQuery}
                        onSearchChange={browserActions.handleSearchChange}
                        sortOption={browserState.sort.field}
                        onSortChange={browserActions.handleSortChange}
                        viewMode={browserState.viewMode}
                        onViewModeChange={browserActions.handleViewModeChange}
                        itemCount={filteredItems.length}
                        mode={activeView}
                        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                        isSidebarOpen={isSidebarOpen}
                    />

                    {/* Strategy Grid */}
                    <div className={`strategy-grid ${browserState.viewMode}`}>
                        {filteredItems.length === 0 ? (
                            <div className="empty-state">
                                <p>No strategies found matching your filters.</p>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => browserActions.handleFilterChange('clear', null)}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            filteredItems.map(strategy => (
                                <div key={strategy.id} className="strategy-item-wrapper">
                                    <StrategyCard
                                        strategy={strategy}
                                        isSelected={browserState.selectedItems.includes(strategy.id)}
                                        onSelect={(selected) => browserActions.handleSelectionChange(strategy.id, selected)}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <BulkActionBar
                selectedCount={browserState.selectedItems.length}
                onClearSelection={browserActions.handleClearSelection}
                mode={activeView}
                onAction={handleBulkAction}
            />

            <style jsx>{`
                .profile-page {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: var(--space-xl);
                }
                .loading, .error {
                    text-align: center;
                    padding: var(--space-2xl);
                    font-size: 1.25rem;
                    color: var(--color-stone);
                }
                .empty-state {
                    text-align: center;
                    padding: var(--space-2xl);
                    background: var(--color-paper);
                    border: 1px solid var(--color-paper-warm);
                    border-radius: 8px;
                    color: var(--color-ink-muted);
                }
                .empty-state p {
                    margin-bottom: var(--space-md);
                }
                .view-toggle-main {
                    display: flex;
                    gap: var(--space-md);
                    margin-bottom: var(--space-lg);
                }
                .toggle-btn {
                    padding: var(--space-md) var(--space-lg);
                    border: none;
                    background: none;
                    font-size: 1.25rem;
                    font-family: var(--font-serif);
                    color: var(--color-stone);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .toggle-btn.active {
                    color: var(--color-ink);
                    text-decoration: underline;
                    text-underline-offset: 4px;
                }
                .profile-content-layout {
                    display: flex;
                    gap: var(--space-xl);
                    min-height: 600px;
                }
                .profile-main-content {
                    flex: 1;
                }
                .strategy-grid.grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: var(--space-lg);
                }
                .strategy-grid.list {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-md);
                }
                
                /* Edit Form Styles */
                .edit-section {
                    background: var(--color-paper);
                    border: 1px solid var(--color-paper-warm);
                    border-radius: 12px;
                    padding: var(--space-xl);
                    margin-bottom: var(--space-xl);
                }
                .edit-section h2 {
                    font-family: var(--font-serif);
                    margin-bottom: var(--space-md);
                }
                .edit-section h3 {
                    font-size: 1rem;
                    margin-bottom: var(--space-sm);
                }
                .edit-form {
                    max-width: 600px;
                }
                .form-group {
                    margin-bottom: var(--space-lg);
                }
                .form-group label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin-bottom: 0.5rem;
                    color: var(--color-stone);
                }
                .form-group input,
                .form-group textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--color-paper-warm);
                    border-radius: 6px;
                    font-family: var(--font-sans);
                    font-size: 0.875rem;
                    background: var(--color-cream);
                }
                .form-group input:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: var(--color-ink);
                }
                .form-desc {
                    color: var(--color-ink-muted);
                    font-size: 0.875rem;
                    margin-bottom: var(--space-md);
                }
                .divider {
                    border: none;
                    height: 1px;
                    background: var(--color-paper-warm);
                    margin: var(--space-lg) 0;
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--space-md);
                    margin-top: var(--space-xl);
                }
            `}</style>
        </div>
    );
}
