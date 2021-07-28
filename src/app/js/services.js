/*jslint indent: 2, browser: true */
/*global angular, Sock, io, $ */

'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
var pokerAppServices = angular.module('pokerApp.services', []);

pokerAppServices.value('version', '0.1');

pokerAppServices.service('socket', [
	'$rootScope',
	'$timeout',
	function ($rootScope) {
		var sock = new Sock($rootScope);
		return sock;
	}
]);

pokerAppServices.factory('socket', [
	'$rootScope',
	function ($rootScope) {
		console.warn(`http://${location.hostname}`);
		console.warn('location: ', location);
		var socket = io.connect(`http://${location.hostname}`, {
			port: location.port,
			reconnect: true,
			'reconnection delay': 500,
			'max reconnection attempts': 10,
			'try multiple transports': true,
			transports: ['websocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']
		});

		$rootScope.socketMessage = null;
		$rootScope.activity = false;
		$rootScope.sessionId = null;

		socket.on('error', function (reason) {
			$rootScope.$apply(function () {
				$rootScope.socketMessage = ':-(  Error = ' + reason;
			});
		});
		socket.on('connect_failed', function (reason) {
			$rootScope.$apply(function () {
				$rootScope.socketMessage = ':-(  Connect failed';
			});
		});
		socket.on('disconnect', function () {
			$rootScope.$apply(function () {
				$rootScope.socketMessage = ':-(  Disconnected';
			});
		});
		socket.on('connecting', function () {
			$rootScope.$apply(function () {
				$rootScope.socketMessage = 'Connecting...';
			});
		});
		socket.on('reconnecting', function () {
			$rootScope.$apply(function () {
				$rootScope.socketMessage = 'Reconnecting...';
			});
		});
		socket.on('reconnect', function () {
			$rootScope.$apply(function () {
				$rootScope.socketMessage = null;
			});
		});
		socket.on('reconnect_failed', function () {
			$rootScope.$apply(function () {
				$rootScope.socketMessage = ':-( Reconnect failed';
			});
		});
		socket.on('connect', function () {
			var sessionId = this.socket.sessionid;
			$rootScope.$apply(function () {
				$rootScope.socketMessage = null;
				if (!$.cookie('sessionId')) {
					$.cookie('sessionId', sessionId);
				}
				$rootScope.sessionId = $.cookie('sessionId');
			});
		});

		return {
			on: function (eventName, callback) {
				$rootScope.socketMessage = null;
				socket.on(eventName, function () {
					var args = arguments;
					$rootScope.$apply(function () {
						callback.apply(socket, args);
					});
				});
			},
			emit: function (eventName, data, callback) {
				$rootScope.activity = true;
				socket.emit(eventName, data, function () {
					var args = arguments;
					$rootScope.$apply(function () {
						$rootScope.activity = false;
						if (callback) {
							callback.apply(socket, args);
						}
					});
				});
			}
		};
	}
]);
