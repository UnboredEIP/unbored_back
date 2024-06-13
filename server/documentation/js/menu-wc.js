'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">server documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AppModule-f2532ae8e7513749a2ceeb741ea4889d95b2f62872aec8c75dacddd431d21f7b6843fd4750078e82c17dc65b3ce9b5684f160ee4527886b46fcf32e2071f80cd"' : 'data-bs-target="#xs-controllers-links-module-AppModule-f2532ae8e7513749a2ceeb741ea4889d95b2f62872aec8c75dacddd431d21f7b6843fd4750078e82c17dc65b3ce9b5684f160ee4527886b46fcf32e2071f80cd"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-f2532ae8e7513749a2ceeb741ea4889d95b2f62872aec8c75dacddd431d21f7b6843fd4750078e82c17dc65b3ce9b5684f160ee4527886b46fcf32e2071f80cd"' :
                                            'id="xs-controllers-links-module-AppModule-f2532ae8e7513749a2ceeb741ea4889d95b2f62872aec8c75dacddd431d21f7b6843fd4750078e82c17dc65b3ce9b5684f160ee4527886b46fcf32e2071f80cd"' }>
                                            <li class="link">
                                                <a href="controllers/AppController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-f2532ae8e7513749a2ceeb741ea4889d95b2f62872aec8c75dacddd431d21f7b6843fd4750078e82c17dc65b3ce9b5684f160ee4527886b46fcf32e2071f80cd"' : 'data-bs-target="#xs-injectables-links-module-AppModule-f2532ae8e7513749a2ceeb741ea4889d95b2f62872aec8c75dacddd431d21f7b6843fd4750078e82c17dc65b3ce9b5684f160ee4527886b46fcf32e2071f80cd"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-f2532ae8e7513749a2ceeb741ea4889d95b2f62872aec8c75dacddd431d21f7b6843fd4750078e82c17dc65b3ce9b5684f160ee4527886b46fcf32e2071f80cd"' :
                                        'id="xs-injectables-links-module-AppModule-f2532ae8e7513749a2ceeb741ea4889d95b2f62872aec8c75dacddd431d21f7b6843fd4750078e82c17dc65b3ce9b5684f160ee4527886b46fcf32e2071f80cd"' }>
                                        <li class="link">
                                            <a href="injectables/AppService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AuthModule-93cba62026e349703d0dcd5dbd7dee48e98d3dc129770a770a1d5f74747e0396aecf69e6c4aa8ce12d74c72d1d7fb05d4ef878e84d70ddebc58f137f6a49b343"' : 'data-bs-target="#xs-controllers-links-module-AuthModule-93cba62026e349703d0dcd5dbd7dee48e98d3dc129770a770a1d5f74747e0396aecf69e6c4aa8ce12d74c72d1d7fb05d4ef878e84d70ddebc58f137f6a49b343"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-93cba62026e349703d0dcd5dbd7dee48e98d3dc129770a770a1d5f74747e0396aecf69e6c4aa8ce12d74c72d1d7fb05d4ef878e84d70ddebc58f137f6a49b343"' :
                                            'id="xs-controllers-links-module-AuthModule-93cba62026e349703d0dcd5dbd7dee48e98d3dc129770a770a1d5f74747e0396aecf69e6c4aa8ce12d74c72d1d7fb05d4ef878e84d70ddebc58f137f6a49b343"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthModule-93cba62026e349703d0dcd5dbd7dee48e98d3dc129770a770a1d5f74747e0396aecf69e6c4aa8ce12d74c72d1d7fb05d4ef878e84d70ddebc58f137f6a49b343"' : 'data-bs-target="#xs-injectables-links-module-AuthModule-93cba62026e349703d0dcd5dbd7dee48e98d3dc129770a770a1d5f74747e0396aecf69e6c4aa8ce12d74c72d1d7fb05d4ef878e84d70ddebc58f137f6a49b343"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-93cba62026e349703d0dcd5dbd7dee48e98d3dc129770a770a1d5f74747e0396aecf69e6c4aa8ce12d74c72d1d7fb05d4ef878e84d70ddebc58f137f6a49b343"' :
                                        'id="xs-injectables-links-module-AuthModule-93cba62026e349703d0dcd5dbd7dee48e98d3dc129770a770a1d5f74747e0396aecf69e6c4aa8ce12d74c72d1d7fb05d4ef878e84d70ddebc58f137f6a49b343"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RefreshStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RefreshStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DatabaseModule.html" data-type="entity-link" >DatabaseModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/EventModule.html" data-type="entity-link" >EventModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-EventModule-fedcb5ddc368b0e227ce62118282cab33409859bc9073f8d38cafd591f569d767a15a8f8fdbe928ea756e7879aa696c93319cf08e503cf79bfa7be29ce1d9ebe"' : 'data-bs-target="#xs-controllers-links-module-EventModule-fedcb5ddc368b0e227ce62118282cab33409859bc9073f8d38cafd591f569d767a15a8f8fdbe928ea756e7879aa696c93319cf08e503cf79bfa7be29ce1d9ebe"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-EventModule-fedcb5ddc368b0e227ce62118282cab33409859bc9073f8d38cafd591f569d767a15a8f8fdbe928ea756e7879aa696c93319cf08e503cf79bfa7be29ce1d9ebe"' :
                                            'id="xs-controllers-links-module-EventModule-fedcb5ddc368b0e227ce62118282cab33409859bc9073f8d38cafd591f569d767a15a8f8fdbe928ea756e7879aa696c93319cf08e503cf79bfa7be29ce1d9ebe"' }>
                                            <li class="link">
                                                <a href="controllers/EventController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EventController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-EventModule-fedcb5ddc368b0e227ce62118282cab33409859bc9073f8d38cafd591f569d767a15a8f8fdbe928ea756e7879aa696c93319cf08e503cf79bfa7be29ce1d9ebe"' : 'data-bs-target="#xs-injectables-links-module-EventModule-fedcb5ddc368b0e227ce62118282cab33409859bc9073f8d38cafd591f569d767a15a8f8fdbe928ea756e7879aa696c93319cf08e503cf79bfa7be29ce1d9ebe"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-EventModule-fedcb5ddc368b0e227ce62118282cab33409859bc9073f8d38cafd591f569d767a15a8f8fdbe928ea756e7879aa696c93319cf08e503cf79bfa7be29ce1d9ebe"' :
                                        'id="xs-injectables-links-module-EventModule-fedcb5ddc368b0e227ce62118282cab33409859bc9073f8d38cafd591f569d767a15a8f8fdbe928ea756e7879aa696c93319cf08e503cf79bfa7be29ce1d9ebe"' }>
                                        <li class="link">
                                            <a href="injectables/EventService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EventService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/GroupModule.html" data-type="entity-link" >GroupModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-GroupModule-06626a39f8fbdd14ca6c617e3fbef269e056b0449a4d8a3f5ac90381b26ea6814f5418f28544ab6cdfe49dba993a9436644b3b6cdd32aebb3d89532a5e919236"' : 'data-bs-target="#xs-controllers-links-module-GroupModule-06626a39f8fbdd14ca6c617e3fbef269e056b0449a4d8a3f5ac90381b26ea6814f5418f28544ab6cdfe49dba993a9436644b3b6cdd32aebb3d89532a5e919236"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-GroupModule-06626a39f8fbdd14ca6c617e3fbef269e056b0449a4d8a3f5ac90381b26ea6814f5418f28544ab6cdfe49dba993a9436644b3b6cdd32aebb3d89532a5e919236"' :
                                            'id="xs-controllers-links-module-GroupModule-06626a39f8fbdd14ca6c617e3fbef269e056b0449a4d8a3f5ac90381b26ea6814f5418f28544ab6cdfe49dba993a9436644b3b6cdd32aebb3d89532a5e919236"' }>
                                            <li class="link">
                                                <a href="controllers/GroupController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GroupController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-GroupModule-06626a39f8fbdd14ca6c617e3fbef269e056b0449a4d8a3f5ac90381b26ea6814f5418f28544ab6cdfe49dba993a9436644b3b6cdd32aebb3d89532a5e919236"' : 'data-bs-target="#xs-injectables-links-module-GroupModule-06626a39f8fbdd14ca6c617e3fbef269e056b0449a4d8a3f5ac90381b26ea6814f5418f28544ab6cdfe49dba993a9436644b3b6cdd32aebb3d89532a5e919236"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-GroupModule-06626a39f8fbdd14ca6c617e3fbef269e056b0449a4d8a3f5ac90381b26ea6814f5418f28544ab6cdfe49dba993a9436644b3b6cdd32aebb3d89532a5e919236"' :
                                        'id="xs-injectables-links-module-GroupModule-06626a39f8fbdd14ca6c617e3fbef269e056b0449a4d8a3f5ac90381b26ea6814f5418f28544ab6cdfe49dba993a9436644b3b6cdd32aebb3d89532a5e919236"' }>
                                        <li class="link">
                                            <a href="injectables/GroupService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GroupService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfileModule.html" data-type="entity-link" >ProfileModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ProfileModule-24a948a19154dacf37a9787dc8aa50610c5ab0386a763693637e739b273e1d456bd78af6173eaf96e968e4d4bf1501787756c035f1f248161274b8df02314e30"' : 'data-bs-target="#xs-controllers-links-module-ProfileModule-24a948a19154dacf37a9787dc8aa50610c5ab0386a763693637e739b273e1d456bd78af6173eaf96e968e4d4bf1501787756c035f1f248161274b8df02314e30"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ProfileModule-24a948a19154dacf37a9787dc8aa50610c5ab0386a763693637e739b273e1d456bd78af6173eaf96e968e4d4bf1501787756c035f1f248161274b8df02314e30"' :
                                            'id="xs-controllers-links-module-ProfileModule-24a948a19154dacf37a9787dc8aa50610c5ab0386a763693637e739b273e1d456bd78af6173eaf96e968e4d4bf1501787756c035f1f248161274b8df02314e30"' }>
                                            <li class="link">
                                                <a href="controllers/ProfileController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ProfileModule-24a948a19154dacf37a9787dc8aa50610c5ab0386a763693637e739b273e1d456bd78af6173eaf96e968e4d4bf1501787756c035f1f248161274b8df02314e30"' : 'data-bs-target="#xs-injectables-links-module-ProfileModule-24a948a19154dacf37a9787dc8aa50610c5ab0386a763693637e739b273e1d456bd78af6173eaf96e968e4d4bf1501787756c035f1f248161274b8df02314e30"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ProfileModule-24a948a19154dacf37a9787dc8aa50610c5ab0386a763693637e739b273e1d456bd78af6173eaf96e968e4d4bf1501787756c035f1f248161274b8df02314e30"' :
                                        'id="xs-injectables-links-module-ProfileModule-24a948a19154dacf37a9787dc8aa50610c5ab0386a763693637e739b273e1d456bd78af6173eaf96e968e4d4bf1501787756c035f1f248161274b8df02314e30"' }>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ProfileService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AddEventDto.html" data-type="entity-link" >AddEventDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/createEventDto.html" data-type="entity-link" >createEventDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/createGroupDto.html" data-type="entity-link" >createGroupDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeleteEventDto.html" data-type="entity-link" >DeleteEventDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/editEventDto.html" data-type="entity-link" >editEventDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/Events.html" data-type="entity-link" >Events</a>
                            </li>
                            <li class="link">
                                <a href="classes/Groups.html" data-type="entity-link" >Groups</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginDto.html" data-type="entity-link" >LoginDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/rateEventDto.html" data-type="entity-link" >rateEventDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/RegisterDto.html" data-type="entity-link" >RegisterDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/removeEventRateDto.html" data-type="entity-link" >removeEventRateDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/sendMessageDto.html" data-type="entity-link" >sendMessageDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateAvatarDto.html" data-type="entity-link" >UpdateAvatarDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateDto.html" data-type="entity-link" >UpdateDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/User.html" data-type="entity-link" >User</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/DatabaseService.html" data-type="entity-link" >DatabaseService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JwtGuard.html" data-type="entity-link" >JwtGuard</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RefreshGuard.html" data-type="entity-link" >RefreshGuard</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});