import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface ProfileHeaderProps {
    profile: {
        walletAddress: string;
        username: string | null;
        bio: string | null;
        avatarUrl: string | null;
        joinedDate: string;
        followersCount: number;
        followingCount: number;
    };
    isOwnProfile: boolean;
    isFollowing: boolean;
    onFollow: () => void;
    onUnfollow: () => void;
    onEdit: () => void;
}

export default function ProfileHeader({
    profile,
    isOwnProfile,
    isFollowing,
    onFollow,
    onUnfollow,
    onEdit
}: ProfileHeaderProps) {
    const formatAddress = (addr: string) =>
        `${addr.slice(0, 4)}...${addr.slice(-4)}`;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="profile-header">
            <div className="profile-header-content">
                {/* Avatar */}
                <div className="profile-avatar">
                    {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="Avatar" />
                    ) : (
                        <div className="avatar-placeholder">
                            {profile.username?.[0]?.toUpperCase() || profile.walletAddress[0]}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="profile-info">
                    <div className="profile-name-section">
                        <h1 className="profile-username">
                            {profile.username || formatAddress(profile.walletAddress)}
                        </h1>
                        <span className="profile-wallet">{formatAddress(profile.walletAddress)}</span>
                    </div>

                    {profile.bio && <p className="profile-bio">{profile.bio}</p>}

                    <div className="profile-meta">
                        <span className="meta-item">
                            <strong>{profile.followersCount}</strong> followers
                        </span>
                        <span className="meta-item">
                            <strong>{profile.followingCount}</strong> following
                        </span>
                        <span className="meta-item">
                            Joined {formatDate(profile.joinedDate)}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="profile-actions-wrapper">
                    <div className="portfolio-summary">
                        <div className="portfolio-stat">
                            <span className="stat-label">Total Value</span>
                            <span className="stat-value">$12,450</span>
                        </div>
                        <div className="portfolio-stat">
                            <span className="stat-label">24h Change</span>
                            <span className="stat-value positive">+5.2%</span>
                        </div>
                    </div>

                    <div className="profile-actions">
                        {isOwnProfile ? (
                            <button className="btn btn-secondary" onClick={onEdit}>
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                {isFollowing ? (
                                    <button className="btn btn-secondary" onClick={onUnfollow}>
                                        Unfollow
                                    </button>
                                ) : (
                                    <button className="btn btn-primary" onClick={onFollow}>
                                        Follow
                                    </button>
                                )}
                            </>
                        )}
                        <button className="btn btn-icon" title="Share">📤</button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .profile-header {
                    background: var(--color-paper);
                    border: 1px solid var(--color-paper-warm);
                    border-radius: 12px;
                    padding: var(--space-xl);
                    margin-bottom: var(--space-xl);
                }
                .profile-header-content {
                    display: flex;
                    gap: var(--space-lg);
                    align-items: flex-start;
                }
                .profile-avatar {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .profile-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, var(--color-ink), var(--color-stone));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: var(--color-cream);
                }
                .profile-info {
                    flex: 1;
                }
                .profile-name-section {
                    margin-bottom: var(--space-sm);
                }
                .profile-username {
                    font-family: var(--font-serif);
                    font-size: 1.75rem;
                    margin: 0 0 0.25rem 0;
                }
                .profile-wallet {
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                    color: var(--color-stone);
                }
                .profile-bio {
                    color: var(--color-ink-muted);
                    margin: var(--space-sm) 0;
                }
                .profile-meta {
                    display: flex;
                    gap: var(--space-lg);
                    font-size: 0.875rem;
                    color: var(--color-ink-muted);
                }
                .meta-item strong {
                    color: var(--color-ink);
                }
                .profile-actions-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: var(--space-lg);
                }
                .portfolio-summary {
                    display: flex;
                    gap: var(--space-lg);
                    text-align: right;
                }
                .portfolio-stat {
                    display: flex;
                    flex-direction: column;
                }
                .stat-label {
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    color: var(--color-stone);
                    margin-bottom: 4px;
                }
                .stat-value {
                    font-family: var(--font-mono);
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: var(--color-ink);
                }
                .stat-value.positive { color: var(--color-success); }
                .stat-value.negative { color: var(--color-error); }
                .profile-actions {
                    display: flex;
                    gap: var(--space-sm);
                }
            `}</style>
        </div>
    );
}
