import React, { useState } from 'react';
import { DEFAULT_SETTINGS, saveSettings } from '../config/settings';
import type { EnhancerSettings } from '../config/settings';
import './SettingsMenu.css';

interface SettingsMenuProps {
  initialSettings: EnhancerSettings;
  onClose: () => void;
}

const ToggleRow = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) => (
  <div className="yte-row">
    <label className="yte-label">{label}</label>
    <label className="yte-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="yte-slider"></span>
    </label>
  </div>
);

const SelectRow = ({ label, value, options, onChange }: { label: string, value: string, options: {val: string, label: string}[], onChange: (val: string) => void }) => (
  <div className="yte-row">
    <label className="yte-label">{label}</label>
    <select className="yte-select" value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
    </select>
  </div>
);

const InputRow = ({ label, type = "number", value, onChange, min, max, step }: any) => (
  <div className="yte-row">
    <label className="yte-label">{label}</label>
    <input className="yte-input" type={type} min={min} max={max} step={step} value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const ColorRow = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div className="yte-row">
    <label className="yte-label">{label}</label>
    <input className="yte-color-input" type="color" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const RangeRow = ({ label, value, onChange, min, max, step }: any) => (
  <div className="yte-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      <label className="yte-label">{label}</label>
      <span style={{ fontSize: '12px', color: '#aaaaaa' }}>{value}</span>
    </div>
    <input type="range" className="yte-range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ width: '100%' }} />
  </div>
);

const TextareaRow = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div className="yte-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
    <label className="yte-label">{label}</label>
    <textarea className="yte-input" value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} />
  </div>
);

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ initialSettings, onClose }) => {
  const [settings, setSettings] = useState<EnhancerSettings>(initialSettings);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    // Add a quick exit animation by manipulating DOM or state before unmounting
    setIsClosing(true);
    setTimeout(onClose, 250);
  };

  const handleSave = () => {
    saveSettings(settings);
    location.reload();
  };

  const handleReset = () => {
    if (confirm("Reset all settings to defaults?")) {
      setSettings(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    }
  };

  const updateSection = <K extends keyof EnhancerSettings>(section: K, updates: Partial<EnhancerSettings[K]>) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  const updateRoot = (updates: Partial<EnhancerSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="yte-settings-overlay" style={{ opacity: isClosing ? 0 : 1, transition: 'opacity 0.2s' }}>
      <div className="yte-settings-modal" style={{ transform: isClosing ? 'scale(0.95)' : '', transition: 'transform 0.2s' }}>
        
        <div className="yte-settings-header">
          <div>
            <h2 className="yte-settings-title">YouTube Creme</h2>
            <p className="yte-settings-subtitle">Customize your premium viewing experience</p>
          </div>
          <button onClick={handleClose} className="yte-close-btn">&times;</button>
        </div>

        <div className="yte-settings-content">
          
          <div className="yte-section">
            <h3 className="yte-section-title">Rating Bar</h3>
            <ToggleRow label="Enable Rating Bar" checked={settings.ratingBar.enabled} onChange={v => updateSection('ratingBar', { enabled: v })} />
            <SelectRow label="Position" value={settings.ratingBar.position} onChange={v => updateSection('ratingBar', { position: v as any })} options={[
              {val: "bottom", label: "Bottom"}, {val: "top", label: "Top"}
            ]} />
            <InputRow label="Height (px)" value={settings.ratingBar.height} onChange={(v: string) => updateSection('ratingBar', { height: parseInt(v) || 0 })} />
            <RangeRow label="Opacity (%)" min="0" max="100" step="1" value={settings.ratingBar.opacity} onChange={(v: number) => updateSection('ratingBar', { opacity: v })} />
            <SelectRow label="Color Scheme" value={settings.ratingBar.colorScheme} onChange={v => updateSection('ratingBar', { colorScheme: v as any })} options={[
              {val: "blue-gray", label: "Blue / Gray"}, {val: "green-red", label: "Green / Red"}, {val: "custom-colors", label: "Custom"}
            ]} />
            {settings.ratingBar.colorScheme === "custom-colors" && (
              <>
                <ColorRow label="Likes Color" value={settings.ratingBar.likesColor} onChange={v => updateSection('ratingBar', { likesColor: v })} />
                <ColorRow label="Dislikes Color" value={settings.ratingBar.dislikesColor} onChange={v => updateSection('ratingBar', { dislikesColor: v })} />
                <ToggleRow label="Enable Custom Color Separator" checked={settings.ratingBar.colorSeparator} onChange={v => updateSection('ratingBar', { colorSeparator: v })} />
              </>
            )}
            <ToggleRow label="Enable Visual Separator" checked={settings.ratingBar.separator} onChange={v => updateSection('ratingBar', { separator: v })} />
            <ToggleRow label="Show Stats Text" checked={settings.ratingBar.showStatsText} onChange={v => updateSection('ratingBar', { showStatsText: v })} />
            <ToggleRow label="Show Tooltip (Hover stats)" checked={settings.ratingBar.tooltip} onChange={v => updateSection('ratingBar', { tooltip: v })} />
            <ToggleRow label="Exponential Scaling (Enhances tiny dislike ratios)" checked={settings.ratingBar.exponentialScaling} onChange={v => updateSection('ratingBar', { exponentialScaling: v })} />
            {settings.ratingBar.exponentialScaling && (
              <RangeRow label="Exponential Power" min="1" max="20" step="0.5" value={settings.ratingBar.exponentialPower} onChange={(v: number) => updateSection('ratingBar', { exponentialPower: v })} />
            )}
            <ToggleRow label="Apply To Video Player Page" checked={settings.ratingBar.applyToVideoPage} onChange={v => updateSection('ratingBar', { applyToVideoPage: v })} />
          </div>

          <div className="yte-section">
            <h3 className="yte-section-title">Declutter & Clean UI</h3>
            <ToggleRow label="Enable Declutter Features" checked={settings.declutter?.enabled || false} onChange={v => updateSection('declutter', { enabled: v })} />
            {settings.declutter?.enabled && (
              <>
                <ToggleRow label="Hide Shorts Everywhere" checked={settings.declutter.hideShorts} onChange={v => updateSection('declutter', { hideShorts: v })} />
                <ToggleRow label="Hide Homepage (Browse)" checked={settings.declutter.hideHomepage} onChange={v => updateSection('declutter', { hideHomepage: v })} />
                <ToggleRow label="Hide Sidebar" checked={settings.declutter.hideSidebar} onChange={v => updateSection('declutter', { hideSidebar: v })} />
                <ToggleRow label="Hide Live Streams" checked={settings.declutter.hideLiveStreams} onChange={v => updateSection('declutter', { hideLiveStreams: v })} />
                <ToggleRow label="Hide Upcoming Premieres" checked={settings.declutter.hideUpcoming} onChange={v => updateSection('declutter', { hideUpcoming: v })} />
                <ToggleRow label="Hide Mixes & Playables" checked={settings.declutter.hideMixes} onChange={v => updateSection('declutter', { hideMixes: v })} />
                <ToggleRow label="Hide Related Videos (End Screen)" checked={settings.declutter.hideEndScreen} onChange={v => updateSection('declutter', { hideEndScreen: v })} />
                <ToggleRow label="Hide Comments entirely" checked={settings.declutter.hideComments} onChange={v => updateSection('declutter', { hideComments: v })} />
                <ToggleRow label="Fix Grid Layout Gaps (Flex-Reflow)" checked={settings.declutter.fixGridGaps} onChange={v => updateSection('declutter', { fixGridGaps: v })} />
              </>
            )}
          </div>

          <div className="yte-section">
            <h3 className="yte-section-title">Advanced Focus & Zen</h3>
            <SelectRow label="Redirect Homepage To" value={settings.declutter?.redirectHomepageTo || 'none'} onChange={v => updateSection('declutter', { redirectHomepageTo: v as any })} options={[
              {val: "none", label: "Disabled (Do not redirect)"},
              {val: "subscriptions", label: "Subscriptions"},
              {val: "library", label: "Library / You"},
              {val: "watch_later", label: "Watch Later"}
            ]} />
            <ToggleRow label="Grayscale Mode" checked={settings.declutter?.grayscaleMode || false} onChange={v => updateSection('declutter', { grayscaleMode: v })} />
            <ToggleRow label="Hide Promoted & 'People Also Watched' in Search" checked={settings.declutter?.hidePromotedSearch || false} onChange={v => updateSection('declutter', { hidePromotedSearch: v })} />
          </div>

          <div className="yte-section">
            <h3 className="yte-section-title">Player Automation Tweaks</h3>
            <ToggleRow label="Auto-Skip Ads" checked={settings.declutter?.autoSkipAds || false} onChange={v => updateSection('declutter', { autoSkipAds: v })} />
            <ToggleRow label="Auto-Expand Description" checked={settings.declutter?.autoExpandDescription || false} onChange={v => updateSection('declutter', { autoExpandDescription: v })} />
            <ToggleRow label="Auto-Theater Mode" checked={settings.declutter?.autoTheaterMode || false} onChange={v => updateSection('declutter', { autoTheaterMode: v })} />
            <ToggleRow label="Hide Info Cards & 'Play Next'" checked={settings.declutter?.hideInfoCards || false} onChange={v => updateSection('declutter', { hideInfoCards: v })} />
            <ToggleRow label="Hide Native Metrics (Likes & Subs)" checked={settings.declutter?.hideNativeMetrics || false} onChange={v => updateSection('declutter', { hideNativeMetrics: v })} />
            <ToggleRow label="Only Show Comments with Timestamps" checked={settings.declutter?.timestampCommentsOnly || false} onChange={v => updateSection('declutter', { timestampCommentsOnly: v })} />
          </div>

          <div className="yte-section">
            <h3 className="yte-section-title">Video Filters</h3>
            <ToggleRow label="Enable Video Filters" checked={settings.videoFilter.enabled} onChange={v => updateSection('videoFilter', { enabled: v })} />
            <SelectRow label="Action" value={settings.videoFilter.action} onChange={v => updateSection('videoFilter', { action: v as any })} options={[
              {val: "dim", label: "Dim (Fade Out)"}, {val: "remove", label: "Remove Completely"}
            ]} />
            {settings.videoFilter.action === "dim" && (
              <RangeRow label="Dim Opacity" min="0" max="1" step="0.05" value={settings.videoFilter.dimOpacity} onChange={(v: number) => updateSection('videoFilter', { dimOpacity: v })} />
            )}
            <InputRow label="Minimum Rating %" step="0.1" value={settings.videoFilter.minRatingPercent} onChange={(v: string) => updateSection('videoFilter', { minRatingPercent: parseFloat(v) || 0 })} />
            <InputRow label="Minimum Views" value={settings.videoFilter.minViews} onChange={(v: string) => updateSection('videoFilter', { minViews: parseInt(v) || 0 })} />
            <InputRow label="Maximum Views (0 to ignore)" value={settings.videoFilter.maxViews} onChange={(v: string) => updateSection('videoFilter', { maxViews: parseInt(v) || 0 })} />
            <ToggleRow label="Hide Live Streams" checked={settings.videoFilter.hideLiveStreams} onChange={v => updateSection('videoFilter', { hideLiveStreams: v })} />
          </div>

          <div className="yte-section">
            <h3 className="yte-section-title">Duration Filter</h3>
            <ToggleRow label="Enable Duration Filter" checked={settings.durationFilter.enabled} onChange={v => updateSection('durationFilter', { enabled: v })} />
            <SelectRow label="Action" value={settings.durationFilter.action} onChange={v => updateSection('durationFilter', { action: v as any })} options={[
              {val: "dim", label: "Dim (Fade Out)"}, {val: "remove", label: "Remove Completely"}
            ]} />
            {settings.durationFilter.action === "dim" && (
              <RangeRow label="Dim Opacity" min="0" max="1" step="0.05" value={settings.durationFilter.dimOpacity} onChange={(v: number) => updateSection('durationFilter', { dimOpacity: v })} />
            )}
            <InputRow label="Minimum Duration (Seconds)" value={settings.durationFilter.minDurationSeconds} onChange={(v: string) => updateSection('durationFilter', { minDurationSeconds: parseInt(v) || 0 })} />
            <ToggleRow label="Apply Only On Search Page" checked={settings.durationFilter.applyOnSearchOnly} onChange={v => updateSection('durationFilter', { applyOnSearchOnly: v })} />
          </div>

          <div className="yte-section">
            <h3 className="yte-section-title">Seen Videos</h3>
            <ToggleRow label="Hide/Dim Seen Videos" checked={settings.seenVideos.enabled} onChange={v => updateSection('seenVideos', { enabled: v })} />
            <SelectRow label="Action" value={settings.seenVideos.action} onChange={v => updateSection('seenVideos', { action: v as any })} options={[
              {val: "dim", label: "Dim (Fade Out)"}, {val: "remove", label: "Remove Completely"}
            ]} />
            {settings.seenVideos.action === "dim" && (
              <RangeRow label="Dim Opacity" min="0" max="1" step="0.05" value={settings.seenVideos.dimOpacity} onChange={(v: number) => updateSection('seenVideos', { dimOpacity: v })} />
            )}
          </div>

          <div className="yte-section">
            <h3 className="yte-section-title">Developer & Overrides</h3>
            <ToggleRow label="Enable Debug Mode" checked={settings.debugMode} onChange={v => updateRoot({ debugMode: v })} />
            <InputRow label="API Cache Duration (Hours)" value={settings.cacheDurationHours} onChange={(v: string) => updateRoot({ cacheDurationHours: parseInt(v) || 0 })} />
            <TextareaRow label="Custom JSON Selectors" value={settings.customSelectors} onChange={v => updateRoot({ customSelectors: v })} />
          </div>

        </div>

        <div className="yte-settings-footer">
          <button onClick={handleReset} className="yte-btn yte-btn-secondary">Reset Defaults</button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleClose} className="yte-btn yte-btn-secondary">Cancel</button>
            <button onClick={handleSave} className="yte-btn yte-btn-primary">Save &amp; Reload</button>
          </div>
        </div>

      </div>
    </div>
  );
};
