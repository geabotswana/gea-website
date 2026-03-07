/**
 * Service Account Configuration for Sending Emails from board@geabotswana.org
 *
 * To populate this file:
 * 1. Create a service account in Google Cloud Console
 * 2. Generate a JSON key
 * 3. Copy the entire JSON key content below between the curly braces
 */

var BOARD_SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "gea-association-platform",
  "private_key_id": "bc05e8e2c7734a8c5ed4cf7299011c5234f888be",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCxTGot4gONLCTu\n/i9qqPAve7RpoZF6UsMCx/9gR/bmi0lFNblVA3xdi8U6dIBeY7uUq+AJm1yIZo35\nY3bRIEv1h+uhzC/0xoc5o1lxsF3QkZcUD9Nrn5YQBRdqa9CYs+yCOOm0I5QlEayH\n7+9kbc42x/TMsdTmSTwhTWiettmcWCdUi5HXmiubSAds5ZhKw7OpkjrUudmSCrvV\nEVEv+YM7ElbN1tG5TGzJD02e5Z/Z9bLbIyL7nhu9YDx5f9K9ZFk0AkAKK+sqT7df\nxadQpTAmlfryRGMwZwDawACjb6wXeizZfHnbMB3zVOBQqmMZsAZMYDKISoycWSH2\n426ZLC3DAgMBAAECggEAQ+45SHcuUSq2w/MUC9PKowbMqyRCbxHCshAa4rLwAIkh\ne6kH53C8d8MTwD/e50tjFaV843FpVMGmaAUaAypSsDJxr75iKXDfYtAZdxvR9hWy\nQveFU9kDUAQDYr0IYVmepo5TzLdNDZ7l8feWS25e8lJOkxcXsVwh88iK6zS3z9S7\ndizrojSl51HmddN78fvsKRjXndCHmVCcsJ3YjVN42QhPn7E9Y5wOe3epb4gDQf0H\nuWXYBerJ0iIqB5KoXulpD0DVhlwuU7VHA40uC02hu0vFKAdYZactLtuPaFIjFyU0\nZOhtAY4+KkS7erhGSXygV8dI4ei5tCt1CwJ4WXELUQKBgQDb9HIcfGhZmJZKcKjx\nRvnosvdC/GsUe+9YaTXUmf2UGzU2FvMkffTtRxEz3b8XptsNmyzVy5ycbvolFD8v\nZVYtP38dnfmZP2lYDeAVbHhFe298aRUJ2QSN5gbui5M98yUIVIWY60ylAmIm2+dy\nkKSY/NP+pFjEZmZ2DovznwWL9QKBgQDOWnKLptb1y7ldzmZvNkakHALj4EyYFip/\nXSaICIQedy788yd71n9CGNvbKiAUpduPl0xQSg5taiE2GyB2eCbikFDDNU8Va7WX\nZ7Ze2XlO+rKsQMDpL0LGP/nT18dvKzN7pVst6RszsMqJqrd4URBiMaOQL19C7kOm\nO/zU62o31wKBgQCtIfKYXYy9yY+zNI6mrJmWAxkCDzIyQ4OYceg/Wp7xb6Eo3FOy\ny7p48tGlo8wA0APo59YYy1aRBAG+IfvCUN/Oagaix3BqojFHcFSMSH87IfgVU5mN\n0Nb24rNeHVtfDf5+Whl2zu/bis67i6jY0uXczlYIQFDm9zt7fePHdcql6QKBgQDC\n/8/czmW2UrUxwzkjgQvSSzIj+zMGSXQRdYpS5JFNZN0/Zdv696C8aldgzXcRbAaG\ns7gG62Sk2rTVt16+9R3x3eSkA71fBbDNidFZ4nLzQo8TngFumh2k0JIaMX+iOxXk\nk0cNpInzF+7dlzjXdutfj378YvfHfPbqoSd0YZ63cwKBgQCjm1uPrTpT0k4/Isnq\nzx2KApdi0MLHxFrOoWYvK7IBrLdWi2VTVIWs5F/RDDARAroM9fmCsGRX9tL0l49t\nzAB1xiHz/ck2uzetubDG9HOIgkQdWzcxTrTsOQAr6LRlSzuHxt8d9MOqDJFqDEpZ\nxpoSkry8iYiE6JDfUDmXnP02Pg==\n-----END PRIVATE KEY-----\n",
  "client_email": "gea-board-mailer@gea-association-platform.iam.gserviceaccount.com",
  "client_id": "102352580715640015123",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/gea-board-mailer%40gea-association-platform.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

var BOARD_EMAIL_TO_SEND_FROM = "board@geabotswana.org";
var BOARD_EMAIL_DELEGATED_USER = "treasurer@geabotswana.org";  // User with Send Mail As delegation
