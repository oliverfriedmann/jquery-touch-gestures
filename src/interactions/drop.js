BetaJS.UI.Interactions.ElementInteraction.extend("BetaJS.UI.Interactions.Drop", {
	
    constructor: function (element, options, data) {
		options = BetaJS.Objs.extend({
			droppable: function () {
				return true;
			},
			context: this,
			bounding_box: function (bb) {
				return bb;
			}
		}, options);
		this._inherited(BetaJS.UI.Interactions.Drop, "constructor", element, options);
		this._host.initialize("BetaJS.UI.Interactions.Drop.Idle");
		this._modifier = new BetaJS.UI.Elements.ElementModifier(this._element);
		this.data = data;
	},
	
	destroy: function () {
		this._modifier.revert();
		this._modifier.destroy();
		this._host.destroy();
		this._inherited(BetaJS.UI.Interactions.Drop, "destroy");
	},
	
	_enable: function () {
		this._host.state().next("Idle");
	},
	
	_disable: function () {
		this._host.state().next("Disabled");
	},
	
	modifier: function () {
		return this._modifier;
	},
	
	__eventData: function () {
		return {
			element: this.element(),
			modifier: this.modifier(),
			target: this,
			data: this.data,
			source: this._host.state()._drag_source ? this._host.state()._drag_source : null
		};
	},
	
	__triggerEvent: function (label) {
		this.trigger(label, this.__eventData());
	},

	droppable: function (source) {
		return this._options.droppable.call(this._options.context, source, this);
	},
	
	_is_hovering: function (source) {
		if (!source.source.options().droppable)
			return false;
		var bb = BetaJS.UI.Elements.Support.elementBoundingBox(this.element());
		bb = this._options.bounding_box.call(this._options.context, bb);
		var co = source.page_coords;
		return bb.left <= co.x && co.x <= bb.right && bb.top <= co.y && co.y <= bb.bottom;
	}
	
});

BetaJS.UI.Interactions.State.extend("BetaJS.UI.Interactions.Drop.Disabled", {
	
	_white_list: ["Idle"],
	
	trigger: function (label) {
		this.parent().__triggerEvent(label);
	}	

});

BetaJS.UI.Interactions.Drop.Disabled.extend("BetaJS.UI.Interactions.Drop.Idle", {
	
	_white_list: ["Hover", "InvalidHover", "Disabled"],

	_start: function () {
		this.on(this.element(), "drag-hover", function (event) {
			var drag_source = event.originalEvent.detail;
			if (this.parent()._is_hovering(drag_source))
				this.next(this.parent().droppable(drag_source) ? "Hover" : "InvalidHover", {drag_source: drag_source});
		});
	}

});

BetaJS.UI.Interactions.Drop.Disabled.extend("BetaJS.UI.Interactions.Drop.Hover", {
	
	_white_list: ["Idle", "Disabled", "Dropping"],
	_persistents: ["drag_source"],

	_start: function () {
		this.trigger("hover");
		this.on(this.element(), "drag-hover", function (event) {
			this._drag_source = event.originalEvent.detail;
			if (!this.parent()._is_hovering(this._drag_source))
				this.next("Idle");
		});
		this.on(this.element(), "drag-stop drag-leave", function (event) {
			this._drag_source = event.originalEvent.detail;
			this.next("Idle");
		});
		this.on(this.element(), "drag-drop", function (event) {
			this._drag_source = event.originalEvent.detail;
			this.next("Dropping");
		});
	},
	
	_end: function () {
		this.trigger("unhover");
		this.parent().modifier().revert();
		this._inherited(BetaJS.UI.Interactions.Drop.Hover, "_end");
	}

});

BetaJS.UI.Interactions.Drop.Disabled.extend("BetaJS.UI.Interactions.Drop.InvalidHover", {
	
	_white_list: ["Idle", "Disabled"],
	_persistents: ["drag_source"],

	_start: function () {
		this.trigger("hover-invalid");
		this.on(this.element(), "drag-hover", function (event) {
			this._drag_source = event.originalEvent.detail;
			if (!this.parent()._is_hovering(this._drag_source))
				this.next("Idle");
		});
		this.on(this.element(), "drag-drop drag-stop drag-leave", function (event) {
			this._drag_source = event.originalEvent.detail;
			this.next("Idle");
		});
	},
	
	_end: function () {
		this.trigger("unhover");
		this.parent().modifier().revert();
		this._inherited(BetaJS.UI.Interactions.Drop.InvalidHover, "_end");
	}

});

BetaJS.UI.Interactions.Drop.Disabled.extend("BetaJS.UI.Interactions.Drop.Dropping", {

	_white_list: ["Idle", "Disabled"],
	_persistents: ["drag_source"],

	_start: function () {
		this.trigger("dropped");
		this._drag_source.source.dropped(this.parent());
		this.next("Idle");
	}

});
