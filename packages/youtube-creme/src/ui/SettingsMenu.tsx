import React, { useState } from 'react';
import { DEFAULT_SETTINGS, saveSettings } from '../config/settings';
import type { EnhancerSettings } from '../config/settings';

interface SettingsMenuProps {
  initialSettings: EnhancerSettings;
  onClose: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ initialSettings, onClose }) => {
  const [settings, setSettings] = useState<EnhancerSettings>(initialSettings);

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

  // Modern styling properties
  const containerStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
    zIndex: 9999999, display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: '20px', boxSizing: 'border-box'
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    color: '#fff',
    borderRadius: '16px',
    width: '100%', maxWidth: '600px', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFamily: '"Roboto", "Inter", sans-serif',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const headerStyle: React.CSSProperties = {
    padding: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'linear-gradient(90deg, rgba(255,0,0,0.2) 0%, rgba(30,30,30,0) 100%)',
    position: 'sticky', top: 0, zIndex: 10
  };

  const contentStyle: React.CSSProperties = {
    padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px'
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px', padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex', flexDirection: 'column', gap: '16px'
  };

  const footerStyle: React.CSSProperties = {
    padding: '20px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    display: 'flex', justifyContent: 'space-between'
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#fff', padding: '8px 12px', borderRadius: '6px', outline: 'none'
  };

  const buttonPrimaryStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
    color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px',
    cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'opacity 0.2s'
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '10px 24px', borderRadius: '8px',
    cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'background 0.2s'
  };

  return (
    <div style={containerStyle}>
      <div style={modalStyle}>
        
        <div style={headerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>YouTube Creme Settings</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#ccc' }}>Customize your enhancement experience</p>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
          </div>
        </div>

        <div style={contentStyle}>
          
          <div style={sectionStyle}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#ff4d4d' }}>Rating Bar</h3>
            <div style={rowStyle}>
              <label>Enable Rating Bar</label>
              <input type="checkbox" checked={settings.ratingBar.enabled} onChange={e => updateSection('ratingBar', { enabled: e.target.checked })} />
            </div>
            <div style={rowStyle}>
              <label>Position</label>
              <select style={inputStyle} value={settings.ratingBar.position} onChange={e => updateSection('ratingBar', { position: e.target.value as "top" | "bottom" })}>
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
              </select>
            </div>
            <div style={rowStyle}>
              <label>Height (px)</label>
              <input style={inputStyle} type="number" value={settings.ratingBar.height} onChange={e => updateSection('ratingBar', { height: parseInt(e.target.value) || 0 })} />
            </div>
            <div style={rowStyle}>
              <label>Color Scheme</label>
              <select style={inputStyle} value={settings.ratingBar.colorScheme} onChange={e => updateSection('ratingBar', { colorScheme: e.target.value as any })}>
                <option value="blue-gray">Blue / Gray</option>
                <option value="green-red">Green / Red</option>
                <option value="custom-colors">Custom</option>
              </select>
            </div>
            <div style={rowStyle}>
              <label>Show Stats Text</label>
              <input type="checkbox" checked={settings.ratingBar.showStatsText} onChange={e => updateSection('ratingBar', { showStatsText: e.target.checked })} />
            </div>
            <div style={rowStyle}>
              <label>Show Tooltip (Hover stats)</label>
              <input type="checkbox" checked={settings.ratingBar.tooltip} onChange={e => updateSection('ratingBar', { tooltip: e.target.checked })} />
            </div>
            <div style={rowStyle}>
              <label>Exponential Scaling</label>
              <input type="checkbox" checked={settings.ratingBar.exponentialScaling} onChange={e => updateSection('ratingBar', { exponentialScaling: e.target.checked })} />
            </div>
            {settings.ratingBar.exponentialScaling && (
              <div style={rowStyle}>
                <label>Exponential Power (Sensitivity)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input style={{ flexGrow: 1 }} type="range" min="1" max="20" step="0.5" value={settings.ratingBar.exponentialPower ?? 4} onChange={e => updateSection('ratingBar', { exponentialPower: parseFloat(e.target.value) || 4 })} />
                  <span style={{ fontSize: '12px', minWidth: '30px' }}>{settings.ratingBar.exponentialPower ?? 4}</span>
                </div>
              </div>
            )}
          </div>

          <div style={sectionStyle}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#ff4d4d' }}>Video Filters</h3>
            <div style={rowStyle}>
              <label>Enable Video Filters</label>
              <input type="checkbox" checked={settings.videoFilter.enabled} onChange={e => updateSection('videoFilter', { enabled: e.target.checked })} />
            </div>
            <div style={rowStyle}>
              <label>Action</label>
              <select style={inputStyle} value={settings.videoFilter.action} onChange={e => updateSection('videoFilter', { action: e.target.value as "dim" | "remove" })}>
                <option value="dim">Dim (Fade Out)</option>
                <option value="remove">Remove Completely</option>
              </select>
            </div>
            {settings.videoFilter.action === "dim" && (
              <div style={rowStyle}>
                <label>Dim Opacity (0 to 1)</label>
                <input style={inputStyle} type="number" step="0.05" min="0" max="1" value={settings.videoFilter.dimOpacity} onChange={e => updateSection('videoFilter', { dimOpacity: parseFloat(e.target.value) || 0 })} />
              </div>
            )}
            <div style={rowStyle}>
              <label>Minimum Rating %</label>
              <input style={inputStyle} type="number" min="0" max="100" step="0.1" value={settings.videoFilter.minRatingPercent} onChange={e => updateSection('videoFilter', { minRatingPercent: parseFloat(e.target.value) || 0 })} />
            </div>
            <div style={rowStyle}>
              <label>Minimum Views</label>
              <input style={inputStyle} type="number" min="0" value={settings.videoFilter.minViews} onChange={e => updateSection('videoFilter', { minViews: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#ff4d4d' }}>Duration Filters</h3>
            <div style={rowStyle}>
              <label>Enable Duration Filters</label>
              <input type="checkbox" checked={settings.durationFilter.enabled} onChange={e => updateSection('durationFilter', { enabled: e.target.checked })} />
            </div>
            <div style={rowStyle}>
              <label>Action</label>
              <select style={inputStyle} value={settings.durationFilter.action} onChange={e => updateSection('durationFilter', { action: e.target.value as "dim" | "remove" })}>
                <option value="dim">Dim (Fade Out)</option>
                <option value="remove">Remove Completely</option>
              </select>
            </div>
            {settings.durationFilter.action === "dim" && (
              <div style={rowStyle}>
                <label>Dim Opacity (0 to 1)</label>
                <input style={inputStyle} type="number" step="0.05" min="0" max="1" value={settings.durationFilter.dimOpacity} onChange={e => updateSection('durationFilter', { dimOpacity: parseFloat(e.target.value) || 0 })} />
              </div>
            )}
            <div style={rowStyle}>
              <label>Minimum Duration (Seconds)</label>
              <input style={inputStyle} type="number" min="0" value={settings.durationFilter.minDurationSeconds} onChange={e => updateSection('durationFilter', { minDurationSeconds: parseInt(e.target.value) || 0 })} />
            </div>
            <div style={rowStyle}>
              <label>Apply on Search Results Only</label>
              <input type="checkbox" checked={settings.durationFilter.applyOnSearchOnly} onChange={e => updateSection('durationFilter', { applyOnSearchOnly: e.target.checked })} />
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#ff4d4d' }}>Developer Options</h3>
            <div style={rowStyle}>
              <label>Enable Debug Mode</label>
              <input type="checkbox" checked={settings.debugMode} onChange={e => updateRoot({ debugMode: e.target.checked })} />
            </div>
            <div style={rowStyle}>
              <label>API Cache Duration (Hours)</label>
              <input style={inputStyle} type="number" min="0" max="720" step="1" value={settings.cacheDurationHours ?? 24} onChange={e => updateRoot({ cacheDurationHours: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#ff4d4d' }}>Advanced: Custom Selectors</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#aaa', lineHeight: '1.4' }}>
              Override internal DOM selectors using JSON. If YouTube changes their layout, you can fix the script here without modifying the code. Leave empty to use defaults.
            </p>
            <textarea
              style={{ ...inputStyle, width: '100%', height: '150px', fontFamily: 'monospace', resize: 'vertical' }}
              value={settings.customSelectors || ""}
              placeholder='{\n  "thumbnails": "a#thumbnail, a.ytd-thumbnail"\n}'
              onChange={e => updateRoot({ customSelectors: e.target.value })}
            />
          </div>

        </div>

        <div style={footerStyle}>
          <button onClick={handleReset} style={buttonSecondaryStyle} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>Reset Defaults</button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={buttonSecondaryStyle} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>Cancel</button>
            <button onClick={handleSave} style={buttonPrimaryStyle} onMouseOver={e => e.currentTarget.style.opacity = '0.8'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>Save &amp; Reload</button>
          </div>
        </div>

      </div>
    </div>
  );
};
