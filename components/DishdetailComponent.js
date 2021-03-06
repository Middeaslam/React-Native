import React, { Component } from 'react';
import { View, Text, ScrollView, FlatList, Modal, Button, StyleSheet, Alert, PanResponder, Share } from 'react-native';
import { Card, Icon, Input, Rating } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite, postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
    return {
        dishes: state.dishes,
        comments: state.comments,
        favorites: state.favorites
    }
}

const mapDispatchToProps = dispatch => ({
    postFavorite: (dishId) => dispatch(postFavorite(dishId)),
    postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment))
});

function RenderDish(props) {
    const dish = props.dish;

    handleViewRef = ref => this.view = ref;

    const recognizeDrag = ({ moveX, moveY, dx, dy }) => {
        if (dx < -200)
            return true;
        else
            return false;
    }

    const recognizeComment = ({ moveX, moveY, dx, dy}) => {
        if( dx > 200 )
            return true
        return false
    }

    const panResponder = PanResponder.create({

        onStartShouldSetPanResponder: (e, gestureState) => {
            return true;
        },

        onPanResponderGrant: () => {
            this.view.rubberBand(1000)
                .then(endState => console.log(endState.finished ? 'finished' : 'cancelled'));
        },

        onPanResponderEnd: (e, gestureState) => {

            console.log("pan responder end", gestureState);

            if (recognizeDrag(gestureState))
                Alert.alert(
                    'Add Favorite',
                    'Are you sure you wish to add ' + dish.name + ' to favorite?',
                    [
                        {
                            text: 'Cancel',
                            onPress: () => console.log('Cancel Pressed'),
                            style: 'cancel'
                        },
                        {
                            text: 'OK',
                            onPress: () => { props.favorite ? console.log('Already favorite') : props.onPress() }
                        },
                    ],
                    { cancelable: false }
                );
                
            else if( recognizeComment(gestureState)){
                props.toggleModal()
            }

            return true;
        }
    });

    const shareDish = (title, message, url) => {
        Share.share({
            title: title,
            message: title + ': ' + message + ' ' + url,
            url: url
        },{
            dialogTitle: 'Share ' + title
        })
    }

    if (dish != null) {
        return (
            <Animatable.View animation="fadeInDown" duration={2000} delay={1000}

                ref= { this.handleViewRef}
                {...panResponder.panHandlers}>
                <Card
                    featuredTitle={dish.name}
                    image={{ uri: baseUrl + dish.image }}
                >
                    <Text style={{ margin: 10 }}>
                        {dish.description}
                    </Text>
                    <Icon
                        raised
                        reverse
                        name={props.favorite ? 'heart' : 'heart-o'}
                        type='font-awesome'
                        color='#f50'
                        onPress={() => props.favorite ? console.log('Already Favorite') : props.onPress()}
                        style={{ flex: 1 }}
                    >
                    </Icon>

                    <Icon
                        raised
                        reverse
                        name={'pencil'}
                        type='font-awesome' color='#512DA8'
                        onPress={() => props.toggleModal()}
                        style={{ flex: 1 }}
                    >
                    </Icon>

                    <Icon
                            raised
                            reverse
                            name='share'
                            type='font-awesome'
                            color='#51D2A8'
                            onPress={() => shareDish(dish.name, dish.description, baseUrl + dish.image)} />
                </Card>
            </Animatable.View>
        )
    } else {
        return (<View></View>)
    }
}

function RenderComments(props) {
    const comments = props.comments;

    const renderCommentItem = ({ item, index }) => {
        return (
            <View key={index}
                style={{ margin: 10 }}>
                <Text style={{ fontSize: 14 }}>{item.comment}</Text>
                <Text style={{ fontSize: 12 }}>{item.rating} Stars</Text>
                <Text style={{ fontSize: 12 }}>{'-- ' + item.author + ', ' + item.date}</Text>
            </View>
        )
    }

    return (
        <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>
            <Card title={"Comments"}>
                <FlatList
                    data={comments}
                    renderItem={renderCommentItem}
                    keyExtractor={item => item.id.string}
                >
                </FlatList>
            </Card>
        </Animatable.View>
    )
}

class Dishdetail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
            rating: 3,
            author: '',
            comment: ''
        }
        this.toggleModal = this.toggleModal.bind(this)
        this.ratingComplete = this.ratingComplete.bind(this)
    }

    markFavorite(dishId) {
        this.props.postFavorite(dishId)
    }

    static navigationOptions = {
        title: 'Dish Details'
    }

    toggleModal() {
        this.setState({ showModal: !this.state.showModal })
    }

    ratingComplete(rating) {
        this.setState({ rating: rating })
    }

    handleComment(dishId, rating, author, comment) {
        console.log(dishId, rating, author, comment)
        this.props.postComment(dishId, rating, author, comment);
        this.toggleModal();
    }

    render() {

        const dishId = this.props.navigation.getParam('dishId', '')

        return (
            <ScrollView>
                <RenderDish dish={this.props.dishes.dishes[+dishId]}
                    favorite={this.props.favorites.some(el => el === dishId)}
                    onPress={() => this.markFavorite(dishId)}
                    toggleModal={() => this.toggleModal()} />

                <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId == dishId)}></RenderComments>

                <Modal
                    animationType={"slide"}
                    transparent={false}
                    visible={this.state.showModal}
                    onDismiss={() => this.toggleModal()}
                    onRequestClose={() => this.toggleModal()}
                >
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Comment</Text>
                        <Rating
                            showRating
                            type='star'
                            count={5}
                            ratingCount={5}
                            fractions={1}
                            startingValue={3}
                            imageSize={40}
                            style={{ paddingVertical: 10 }}
                            onFinishRating={this.ratingComplete}
                        >
                        </Rating>

                        <Input
                            placeholder='Author'
                            leftIcon={{
                                type: 'font-awesome',
                                name: 'user-o'
                            }}
                            onChangeText={author => this.setState({ author: author })}
                        />

                        <Input
                            placeholder="Your Comment"
                            leftIcon={{
                                type: 'font-awesome',
                                name: 'comment-o'
                            }}
                            onChangeText={comment => this.setState({ comment: comment })}
                        />


                        <View style={styles.formRow}>
                            <Button
                                onPress={() => this.handleComment(dishId, this.state.rating, this.state.author, this.state.comment)}
                                title="Submit"
                                color="#512DA8"
                                style={{ marginTop: 10 }}
                                accessibilityLabel="Post your comment"
                            ></Button>
                        </View>

                        <View style={styles.formRow}>
                            <Button
                                onPress={this.toggleModal}
                                title='Cancel'
                                color='#888'
                                accessibilityLabel="Dismiss modal"
                            ></Button>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
    cardRow: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        flexDirection: 'row',
        margin:'20'
    },
    modal: {
        justifyContent: 'center',
        margin: 20,

    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        backgroundColor: '#512DA8',
        textAlign: 'center',
        color: 'white',
        marginBottom: 20
    },
    modalText: {
        fontSize: 18,
        margin: 10
    },
    formRow: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        flexDirection: 'row',
        margin: 20,
        marginTop: 40
    }
})

export default connect(mapStateToProps, mapDispatchToProps)(Dishdetail);