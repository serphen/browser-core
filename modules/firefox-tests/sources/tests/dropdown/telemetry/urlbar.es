/* eslint func-names: ['error', 'never'] */
/* eslint prefer-arrow-callback: 'off' */
/* eslint no-unused-expressions: 'off' */

import {
  CliqzUtils,
  expect,
  fillIn,
  respondWith,
  waitForPopup,
  waitForPopupClosed,
  withHistory } from '../helpers';
import { results } from '../fixtures/resultsTwoSimple';

export default function () {
  context('generates correct telemetry signals', function () {
    const win = CliqzUtils.getWindow();
    let resultSignals;
    let resultSignalCount;

    beforeEach(function () {
      // clear telemetry
      win.allTelemetry = [];

      withHistory([]);
      respondWith({ results });
      fillIn('ro');
      return waitForPopup();
    });

    context('after blurring the urlbar', function () {
      beforeEach(function () {
        win.gURLBar.blur();
        win.gURLBar.mInputField.blur();
        return waitForPopupClosed()
          .then(function () {
            resultSignals = win.allTelemetry.filter(function (s) {
              return ((s.type === 'activity') && (s.action === 'urlbar_blur'));
            });
            resultSignalCount = resultSignals.length;
          });
      });

      describe('sends an "activity > urlbar_blur" signal', function () {
        it('only once and with correct amount of fields', function () {
          expect(resultSignalCount).to.equal(1);
          resultSignals.forEach(function (signal) {
            expect(Object.keys(signal).length).to.equal(2);
          });
        });
      });

      context('after focusing on the urlbar', function () {
        beforeEach(function () {
          return new Promise(function (resolve) {
            win.allTelemetry = [];
            win.gURLBar.focus();
            win.gURLBar.mInputField.focus();
            CliqzUtils.setTimeout(resolve, 300);
          })
            .then(function () {
              resultSignals = win.allTelemetry.filter(function (s) {
                return ((s.type === 'activity') && (s.action === 'urlbar_focus'));
              });
              resultSignalCount = resultSignals.length;
            });
        });

        describe('sends an "activity > urlbar_focus" signal', function () {
          it('only once and with correct amount of fields', function () {
            expect(resultSignalCount).to.equal(1);
            resultSignals.forEach(function (signal) {
              expect(Object.keys(signal).length).to.equal(2);
            });
          });
        });
      });
    });
  });
}
