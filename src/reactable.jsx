/** @jsx React.DOM */
Reactable = (function() {
    "use strict";

    // Array.prototype.map polyfill - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map#Polyfill
    if (!Array.prototype.map) {
        Array.prototype.map = function(fun /*, thisArg */) {
            "use strict";

            if (this === void 0 || this === null) {
                throw new TypeError();
            }

            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== "function") {
                throw new TypeError();
            }

            var res = new Array(len);
            var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
            for (var i = 0; i < len; i++) {
                // NOTE: Absolute correctness would demand Object.defineProperty
                //       be used.  But this method is fairly new, and failure is
                //       possible only if Object.prototype or Array.prototype
                //       has a property |i| (very unlikely), so use a less-correct
                //       but more portable alternative.
                if (i in t) {
                    res[i] = fun.call(thisArg, t[i], i, t);
                }
            }

            return res;
        };
    }

    // Array.prototype.indexOf polyfill for IE8
    if (!Array.prototype.indexOf)
    {
          Array.prototype.indexOf = function(elt /*, from*/)
          {
                var len = this.length >>> 0;

                var from = Number(arguments[1]) || 0;
                from = (from < 0)
                     ? Math.ceil(from)
                     : Math.floor(from);
                if (from < 0) {
                    from += len;
                }

                for (; from < len; from++)
                {
                    if (from in this && this[from] === elt) {
                        return from;
                    }
                }
                return -1;
          };
    }

    var Reactable = {};

    Reactable.Td = React.createClass({
        render: function() {
            return this.transferPropsTo(
                <td>
                    {this.props.children}
                </td>
            );
        }
    });


    Reactable.Tr = React.createClass({
        render: function() {
            var children = this.props.children || [];

            if (
                this.props.data &&
                this.props.columns &&
                typeof this.props.columns.map === 'function'
            ) {
                children = children.concat(this.props.columns.map(function(column, i) {
                    if (this.props.data.hasOwnProperty(column)) {
                        return <Td col={column} key={column}>{this.props.data[column]}</Td>;
                    } else {
                        return <Td col={column} key={column} />;
                    }
                }.bind(this)));
            }

            return this.transferPropsTo(
                <tr>{children}</tr>
            );
        }
    });

    Reactable.Thead = React.createClass({
        getColumns: function() {
            return React.Children.map(this.props.children, function(th) {
                if (typeof th.props.children === 'string') {
                    return th.props.children;
                } else {
                    throw new TypeError('<th> must have a string child');
                }
            });
        },
        render: function() {
            return this.transferPropsTo(<th>{this.props.children}</th>);
        }
    });

    Reactable.Th = React.createClass({
        render: function() {
            return this.transferPropsTo(<th>{this.props.children}</th>);
        }
    });

    var Paginator = React.createClass({
        render: function() {
            if (typeof this.props.colSpan === 'undefined') {
                throw new TypeError('Must pass a colSpan argument to Paginator');
            }

            if (typeof this.props.numPages === 'undefined' || this.props.numPages === 0) {
                throw new TypeError('Must pass a non-zero numPages argument to Paginator');
            }

            var pageButtons = [];
            for (var i = 0; i < this.props.numPages; i++) {
                var pageNum = i;
                pageButtons.push(
                    <a className="page-button" key={i}
                       // create function to get around for-loop closure issue
                       onClick={(function(pageNum) {
                           return function() {
                               this.props.onPageChange(pageNum);
                           }.bind(this)
                       }.bind(this))(i)}>{i + 1}</a>
                );
            }

            return (
                <tr className="pagination">
                    <td colSpan={this.props.colSpan}>
                        {pageButtons}
                    </td>
                </tr>
            );
        }
    });

    Reactable.Table = React.createClass({
        getInitialState: function() {
            return {
                currentPage: 0,
            };
        },
        onPageChange: function(page) {
            this.setState({ currentPage: page });
        },
        render: function() {
            // Test if the caller passed in data
            var children = this.props.children || [];
            var columns;
            if (
                this.props.children &&
                this.props.children.length > 0 &&
                this.props.children[0].type.ConvenienceConstructor === Reactable.Thead
            ) {
                columns = this.props.children[0].getColumns();
            } else {
                columns = this.props.columns || [];
            }

            if (this.props.data && typeof this.props.data.map === 'function') {
                // Build up the columns array
                children = children.concat(this.props.data.map(function(data, i) {
                    // Update the columns array with the data's keys
                    for (var k in data) {
                        if (data.hasOwnProperty(k)) {
                            if (columns.indexOf(k) < 0) {
                                columns.push(k);
                            }
                        }
                    }
                    return <Tr columns={columns} data={data} key={i} />;
                }.bind(this)));
            }

            var currentChildren;
            if (this.props.pagination === true) {
                var itemsPerPage = this.props.itemsPerPage || 20;
                currentChildren = children.slice(
                        this.state.currentPage * itemsPerPage,
                        (this.state.currentPage + 1) * itemsPerPage);
            } else {
                currentChildren = children;
            }

            return this.transferPropsTo(
                <table>
                    {columns && columns.length > 0 ?
                        <thead>
                            {columns.map(function(col) {
                                return (<th key={col}>{col}</th>);
                            }.bind(this))}
                        </thead> : ''
                    }
                    <tbody>
                        {currentChildren}
                        {this.props.pagination === true ?
                            <Paginator
                                colSpan={columns.length}
                                numPages={Math.ceil(this.props.data.length / itemsPerPage)}
                                onPageChange={this.onPageChange}/> : ''
                        }
                    </tbody>
                </table>
            );
        }
    });

    return Reactable;
}());
