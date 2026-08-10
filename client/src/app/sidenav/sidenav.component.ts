import { Component, Input, Output, EventEmitter, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Location } from '@angular/common';

import { LayoutSettings, NaviItem, NavigationSettings, LinkType, NaviItemType } from '../_models/hmi';
import { Router } from '@angular/router';
import { ProjectService } from '../_services/project.service';
import { LanguageService } from '../_services/language.service';
import { AppService } from '../_services/app.service';
import { Utils } from '../_helpers/utils';

@Component({
    selector: 'app-sidenav',
    templateUrl: './sidenav.component.html',
    styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements AfterContentChecked {

    @Input() sidenav: MatSidenav;
    @Output() goToPage: EventEmitter<string> = new EventEmitter();
    @Output() goToLink: EventEmitter<string> = new EventEmitter();

    viewAsLink = LinkType.address;
    viewAsAlarms = LinkType.alarms;

    logo = null;
    brandName: string = 'FUXA';
    brandLogo: string | null = null;
    layout: LayoutSettings = null;
    showSidenav = false;
    layoutNavigation = new NavigationSettings();
    expandedItems: Set<string> = new Set();
    private expandableNavItems = [Utils.getEnumKey(NaviItemType, NaviItemType.text), Utils.getEnumKey(NaviItemType, NaviItemType.inline)];

    constructor(private location: Location,
                private router: Router,
                private projectService: ProjectService,
                private languageService: LanguageService,
                private appService: AppService,
                private changeDetector: ChangeDetectorRef) {
        // Load brand config
        const brand = this.appService.getBrand();
        this.brandName = brand.name || 'FUXA';
        this.brandLogo = brand.logo || null;
    }

    ngAfterContentChecked(): void {
        this.showSidenav = (this.layout) ? true : false;
        this.changeDetector.detectChanges();
    }

    onGoTo(item: NaviItem) {
        if (this.location.path().startsWith('/home/')) {
            const view = this.projectService.getViewFromId(item.view);
            if (view) {
                this.router.navigate(['/home', view.name]);
            }
        }
        if (item.link && item.view === this.viewAsLink) {
            this.goToLink.emit(item.link);
        } else if (item.view) {
            this.goToPage.emit(item.view);
        }
    }

    toggleSubMenu(item: NaviItem) {
        if (item.id && item.children?.length) {
            if (this.expandedItems.has(item.id)) {
                this.expandedItems.delete(item.id);
            } else {
                this.expandedItems.add(item.id);
            }
            this.changeDetector.detectChanges();
        }
    }

    isExpanded(item: NaviItem): boolean {
        return item.id ? this.expandedItems.has(item.id) : false;
    }

    isExpandable(item: NaviItem): boolean {
        return this.expandableNavItems.includes(this.layout.navigation.type) && item.children?.length > 0;
    }

    public setLayout(layout: LayoutSettings) {
        this.layout = Utils.clone(layout);
        if (this.layout.navigation) {
            this.layoutNavigation = this.layout.navigation;
            // Use brand logo if user hasn't set a custom logo in layout settings
            this.logo = this.layout.navigation.logo || this.brandLogo;
            this.layout.navigation.items?.forEach(item => {
                item.text = this.languageService.getTranslation(item.text) ?? item.text;
                if (!item.id) {
                    item.id = Utils.getShortGUID();
                }
                item.children?.forEach(child => {
                    child.text = this.languageService.getTranslation(child.text) ?? child.text;
                    if (!child.id) {
                        child.id = Utils.getShortGUID();
                    }
                });
            });
        }
    }
}
