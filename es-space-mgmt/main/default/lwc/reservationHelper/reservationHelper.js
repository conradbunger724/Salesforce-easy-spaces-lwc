import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import TILE_SELECTION_MC from '@salesforce/messageChannel/Tile_Selection__c';
import FLOW_STATUS_CHANGE_MC from '@salesforce/messageChannel/Flow_Status_Change__c';
import {
    subscribe,
    unsubscribe,
    APPLICATION_SCOPE,
    MessageContext,
    publish
} from 'lightning/messageService';

export default class ReservationHelper extends LightningElement {
    /*
     *   Component coordinates event comms between Aura-based parent component
     *   and LWC-based siblings. Uses LMS as replacement for ltng:selectSObject event.
     *   TO DO: Replace Aura parent component when support for LWC flow screens available.
     */

    flowStarted = false;
    subscription = null;

    @wire(MessageContext)
    messageContext;

    subscribeToMessageChannel() {
        this.subscription = subscribe(
            this.messageContext,
            TILE_SELECTION_MC,
            (message) => this.handleCustomerSelect(message),
            { scope: APPLICATION_SCOPE }
        );
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    handleCustomerSelect(message) {
        if (message.tileType === 'customer') {
            if (!this.flowStarted) {
                this.flowStarted = true;
                this.dispatchEvent(
                    new CustomEvent('customerchoice', {
                        detail: message.properties
                    })
                );
            } else if (this.flowStarted) {
                const toastEvt = new ShowToastEvent({
                    title: 'Flow interview already in progress',
                    message:
                        'Finish the flow interview in progress before selecting another customer.',
                    variant: 'error'
                });
                this.dispatchEvent(toastEvt);
            }
        }
    }

    @api
    handleFlowExit(event) {
        const payload = {
            flowName: 'createReservation',
            status: 'FINISHED',
            state: { sobjecttype: event.detail }
        };
        publish(this.messageContext, FLOW_STATUS_CHANGE_MC, payload);
    }
}
