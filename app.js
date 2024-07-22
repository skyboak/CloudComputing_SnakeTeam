document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('jsonUploadForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the form from submitting via the browser
        uploadJson();
    });
});

function uploadJson() {
    const fileInput = document.getElementById('jsonFile');
    if (fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const jsonObj = JSON.parse(event.target.result);
                console.log('JSON Object:', jsonObj);
                // Handle the JSON object here
                // For example, display it in a <pre> element
                // document.getElementById('jsonDisplay').textContent = JSON.stringify(jsonObj, null, 2);
            } catch (e) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(fileInput.files[0]);
    } else {
        alert('Please select a file');
    }
}
document.getElementById('fileInput').addEventListener('change', function(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        google.colab.kernel.invokeFunction('notebook.run_cell', [contents], {});
    };
    reader.readAsText(file);
});