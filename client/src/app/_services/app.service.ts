import { Injectable, Output, EventEmitter } from '@angular/core';

import { environment } from '../../environments/environment';
import { SettingsService } from './settings.service';

export interface BrandConfig {
    name: string;
    title: string;
    logo: string | null;
    favicon: string | null;
    shortName: string;
    footer: string;
}

@Injectable()
export class AppService {

    @Output() onShowModeChanged: EventEmitter<string> = new EventEmitter();
    @Output() onShowLoading: EventEmitter<boolean> = new EventEmitter();

    private static APP_DEMO = 'demo';
    private static APP_CLIENT = 'client';

    private showMode: string;
    private brandConfig: BrandConfig;

    constructor(private settingsService: SettingsService) {
        // Load brand config from window.__BRAND__ (injected by server into index.html)
        this.brandConfig = this.loadBrandConfig();
    }

    private loadBrandConfig(): BrandConfig {
        const win = window as any;
        if (win.__BRAND__) {
            return {
                name: win.__BRAND__.name || 'FUXA',
                title: win.__BRAND__.title || 'FUXA',
                logo: win.__BRAND__.logo || null,
                favicon: win.__BRAND__.favicon || null,
                shortName: win.__BRAND__.shortName || win.__BRAND__.name || 'FUXA',
                footer: win.__BRAND__.footer || ''
            };
        }
        return {
            name: 'FUXA',
            title: 'FUXA',
            logo: null,
            favicon: null,
            shortName: 'FUXA',
            footer: ''
        };
    }

    getBrand(): BrandConfig {
        return this.brandConfig;
    }

    getBrandName(): string {
        return this.brandConfig?.name || 'FUXA';
    }

    getBrandLogo(): string | null {
        return this.brandConfig?.logo || null;
    }

    setShowMode(mode: string): string {
        if (mode === 'editor' && this.settingsService.isEditModeLocked()) {
            this.settingsService.notifyEditorLocked();
            return this.showMode;
        } else {
            this.showMode = mode;
            this.onShowModeChanged.emit(this.showMode);
            return this.showMode;
        }
    }

    lockEditMode() {
        this.settingsService.lockEditMode();
    }

    unlockEditMode() {
        this.settingsService.unlockEditMode();
    }

    showLoading(show: boolean) {
        this.onShowLoading.emit(show);
    }

    nodeRedEnabled(): boolean {
        return this.settingsService.getSettings()?.nodeRedEnabled;
    }

    get isDemoApp() {
        return (environment.type === AppService.APP_DEMO);
    }

    get isClientApp() {
        return (environment.type === AppService.APP_CLIENT);
    }
}
