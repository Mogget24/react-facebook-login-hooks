// @flow
import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/facebook.scss';
import FacebookLogin from './facebook.hooks';

// https://www.w3.org/TR/html5/disabled-elements.html#disabled-elements
const _shouldAddDisabledProp = (tag) => [
    'button',
    'input',
    'select',
    'textarea',
    'optgroup',
    'option',
    'fieldset',
].indexOf((tag + '').toLowerCase()) >= 0;

const ReactFacebookLoginWithButton = props => {

    const style = () => {
        const defaultCSS = props.cssClass;
        if (props.cssClass === defaultCSS) {
            return <style dangerouslySetInnerHTML={{ __html: styles }}></style>;
        }
        return false;
    }

    const containerStyle = renderProps => {
        // console.log('containerStyle', renderProps)
        const { isProcessing, isSdkLoaded, isDisabled } = renderProps;

        const style = { transition: 'opacity 0.5s' };
        if (isProcessing || !isSdkLoaded || isDisabled) {
            style.opacity = 0.6;
        }
        return {
            ...style,
            ...props.containerStyle
        };
    }

    const renderOwnButton = renderProps => {
        // console.log('renderOwnButton', renderProps)

        const { cssClass, size, icon, textButton, typeButton, buttonStyle } = props;

        const { onClick, isDisabled } = renderProps;

        const isIconString = typeof icon === 'string';
        const optionalProps = {};
        if (isDisabled && _shouldAddDisabledProp(props.tag)) {
            optionalProps.disabled = true;
        }

        return (
            <span style={containerStyle(renderProps)}>
                {isIconString && (
                    <link
                        rel="stylesheet"
                        href="https://maxcdn.bootstrapcdn.com/font-awesome/4.5.0/css/font-awesome.min.css"
                    />
                )}
                <props.tag
                    type={typeButton}
                    className={`${cssClass} ${size}`}
                    style={buttonStyle}
                    onClick={onClick}
                    {...optionalProps}
                >
                    {icon && isIconString && (
                        <i className={`fa ${icon}`}></i>
                    )}
                    {icon && !isIconString && icon}
                    {textButton}
                </props.tag>
                {style()}
            </span>
        );
    }

    return (
        <FacebookLogin {...props} render={renderProps => renderOwnButton(renderProps)} />
    );
}

ReactFacebookLoginWithButton.propTypes = {
    textButton: PropTypes.string,
    typeButton: PropTypes.string,
    size: PropTypes.string,
    cssClass: PropTypes.string,
    icon: PropTypes.any,
    containerStyle: PropTypes.object,
    buttonStyle: PropTypes.object,
    tag: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};

ReactFacebookLoginWithButton.defaultProps = {
    textButton: 'Login with Facebook',
    typeButton: 'button',
    size: 'metro',
    fields: 'name',
    cssClass: 'kep-login-facebook',
    tag: 'button',
};

export default ReactFacebookLoginWithButton;
