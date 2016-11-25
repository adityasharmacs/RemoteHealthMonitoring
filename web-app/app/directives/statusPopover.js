/*Directive for status popover in notification bar*/

module.exports = function($compile) {
    return {
            scope: true,
            restrict: "A",
            controller: function($scope) {
                $scope.save = function(e) {}
                $scope.cancel = function(e) {}
            },
            link: function(scope, element, attrs){
                    $(element).popover({
                        trigger: 'hover',
                        container: 'body',
                        html: true,
                        content: $compile($(element).siblings(".pop-content").contents() )(scope),
                        placement: attrs.popoverPlacement
                    });
                }
        }
};
