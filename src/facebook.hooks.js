// @flow
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import getParamsFromObject from './objectToParams';
import decodeParamForKey from './decodeParam';

const getIsMobile = () => {
    let isMobile = false;

    try {
        isMobile = !!((window.navigator && window.navigator.standalone) || navigator.userAgent.match('CriOS') || navigator.userAgent.match(/mobile/i));
    } catch (ex) {
        // continue regardless of error
    }

    return isMobile;
};

const FacebookLogin = props => {
    console.log('FacebookLogin', props)

    const { render } = props;
    if (!render) {
        throw new Error('ReactFacebookLogin requires a render prop to render');
    }

    const [sdkLoaded, setSdkLoaded] = useState(false)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        // console.log('useEffect')
        if (document.getElementById('facebook-jssdk')) {
            setSdkLoaded(true)
            return;
        }
        setFbAsyncInit()
        loadSdkAsynchronously()
        let fbRoot = document.getElementById('fb-root');
        if (!fbRoot) {
            fbRoot = document.createElement('div');
            fbRoot.id = 'fb-root';
            document.body.appendChild(fbRoot);
        }
    }, [])

    const setFbAsyncInit = () => {
        // console.log('setFbAsyncInit')
        const { appId, xfbml, cookie, version, autoLoad } = props;
        window.fbAsyncInit = () => {
            window.FB.init({
                version: `v${version}`,
                appId,
                xfbml,
                cookie,
            });
            setSdkLoaded(true)
            if (autoLoad || isRedirectedFromFb()) {
                window.FB.getLoginStatus(checkLoginAfterRefresh);
            }
        };
    }

    const isRedirectedFromFb = () => {
        // console.log('isRedirectedFromFb')
        const params = window.location.search;
        return (
            decodeParamForKey(params, 'state') === 'facebookdirect' && (decodeParamForKey(params, 'code') ||
                decodeParamForKey(params, 'granted_scopes'))
        );
    }

    const loadSdkAsynchronously = () => {
        // console.log('loadSdkAsynchronously')
        const { language } = props;
        ((d, s, id) => {
            const element = d.getElementsByTagName(s)[0];
            const fjs = element;
            let js = element;
            if (d.getElementById(id)) { return; }
            js = d.createElement(s); js.id = id;
            js.src = `https://connect.facebook.net/${language}/sdk.js`;
            fjs.parentNode.insertBefore(js, fjs);
        })(document, 'script', 'facebook-jssdk');
    }

    const responseApi = (authResponse) => {
        // console.log('responseApi', authResponse)
        window.FB.api('/me', { locale: props.language, fields: props.fields }, (me) => {
            props.callback({
                ...me,
                ...authResponse
            });
        });
    };

    const checkLoginState = (response) => {
        // console.log('checkLoginState', response)
        setProcessing(false)
        if (response.authResponse) {
            responseApi(response.authResponse);
        } else {
            if (props.onFailure) {
                props.onFailure({ status: response.status });
            } else {
                props.callback({ status: response.status });
            }
        }
    };

    const checkLoginAfterRefresh = (response) => {
        // console.log('checkLoginAfterRefresh', response)
        if (response.status === 'connected') {
            checkLoginState(response);
        } else {
            window.FB.login(loginResponse => checkLoginState(loginResponse), true);
        }
    };

    const click = evt => {
        if (!sdkLoaded || processing || !!props.isDisabled) {
            return;
        }
        setProcessing(true)
        const { scope, appId, onClick, returnScopes, responseType, redirectUri, disableMobileRedirect, authType, state } = props;
        
        if (typeof onClick === 'function') {
            onClick(evt);
            if (evt.defaultPrevented) {
                setProcessing(false)
                return;
            }
        }
        
        const params = {
            client_id: appId,
            redirect_uri: redirectUri,
            state,
            return_scopes: returnScopes,
            scope,
            response_type: responseType,
            auth_type: authType,
        };

        if (props.isMobile && !disableMobileRedirect) {
            window.location.href = `https://www.facebook.com/dialog/oauth${getParamsFromObject(params)}`;
        } else {
            if (!window.FB) {
                if (props.onFailure) {
                    props.onFailure({ status: 'facebookNotLoaded' });
                }
                return;
            }
            window.FB.getLoginStatus(response => {
                // console.log('getLoginStatus', response)
                if (response.status === 'connected') {
                    checkLoginState(response);
                } else {
                    window.FB.login(checkLoginState, { scope, return_scopes: returnScopes, auth_type: params.auth_type });
                }
            });
        }
    };

    const propsForRender = {
        onClick: evt => click(evt),
        isDisabled: !!props.isDisabled,
        isProcessing: processing,
        isSdkLoaded: sdkLoaded
    };

    return props.render(propsForRender)
}

FacebookLogin.propTypes = {
    isDisabled: PropTypes.bool,
    callback: PropTypes.func.isRequired,
    appId: PropTypes.string.isRequired,
    xfbml: PropTypes.bool,
    cookie: PropTypes.bool,
    authType: PropTypes.string,
    scope: PropTypes.string,
    state: PropTypes.string,
    responseType: PropTypes.string,
    returnScopes: PropTypes.bool,
    redirectUri: PropTypes.string,
    autoLoad: PropTypes.bool,
    disableMobileRedirect: PropTypes.bool,
    isMobile: PropTypes.bool,
    fields: PropTypes.string,
    version: PropTypes.string,
    language: PropTypes.string,
    onClick: PropTypes.func,
    onFailure: PropTypes.func,
    render: PropTypes.func.isRequired,
}

FacebookLogin.defaultProps = {
    redirectUri: typeof window !== 'undefined' ? window.location.href : '/',
    scope: 'public_profile,email',
    returnScopes: false,
    xfbml: false,
    cookie: false,
    authType: '',
    fields: 'name',
    version: '3.1',
    language: 'en_US',
    disableMobileRedirect: false,
    isMobile: getIsMobile(),
    onFailure: null,
    state: 'facebookdirect',
    responseType: 'code',
}

export default FacebookLogin;
