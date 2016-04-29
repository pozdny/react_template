/**
 * Created by user on 28.04.16.
 */

'use strict';
//var React = require('react');
var React = require('react');
var ReactDom = require('react-dom');

var FirstPage = React.createClass({
    componentWillMount: function() {
        console.log('will mount');
    },
    render: function() {
        console.log('render');
        return (
            <div className="page">
                <div className="page-content">
                    Page content
                </div>
            </div>
        );
    },
    componentDidMount: function () {
        console.log('Component loaded');
    }
});

var App = React.createClass({
    render: function() {
        return (
            <div className="pages">
                <FirstPage />
            </div>
        );
    }
});

ReactDom.render(
    <App />,
    document.getElementById('root')
);
console.log('app.js');




